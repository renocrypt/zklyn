// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AccessPass} from "../src/AccessPass.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract AccessPassTest is Test {
    MockUSDC private usdc;
    AccessPass private pass;

    address private owner = address(0xABCD);
    address private treasury = address(0xBEEF);
    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    uint256 private constant PREMIUM_PRICE = 100e6; // 100 USDC (6 decimals)

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        pass = new AccessPass(address(usdc), treasury, PREMIUM_PRICE, "ipfs://base-uri/");
        vm.stopPrank();
    }

    function testClaimFreeOnce() public {
        vm.prank(alice);
        pass.claimFree();

        assertEq(pass.balanceOf(alice, pass.FREE_PASS_ID()), 1);
        assertTrue(pass.freeClaimed(alice));

        vm.prank(alice);
        vm.expectRevert(AccessPass.FreeAlreadyClaimed.selector);
        pass.claimFree();
    }

    function testFreeClaimNotResetAfterTransfer() public {
        vm.startPrank(alice);
        pass.claimFree();
        pass.safeTransferFrom(alice, bob, pass.FREE_PASS_ID(), 1, "");
        vm.stopPrank();

        assertEq(pass.balanceOf(bob, pass.FREE_PASS_ID()), 1);
        assertTrue(pass.freeClaimed(alice));

        vm.prank(alice);
        vm.expectRevert(AccessPass.FreeAlreadyClaimed.selector);
        pass.claimFree();
    }

    function testMintPremiumTransfersUSDC() public {
        usdc.mint(alice, PREMIUM_PRICE * 2);

        vm.startPrank(alice);
        usdc.approve(address(pass), PREMIUM_PRICE * 2);
        pass.mintPremium(2);
        vm.stopPrank();

        assertEq(pass.balanceOf(alice, pass.PREMIUM_PASS_ID()), 2);
        assertEq(usdc.balanceOf(treasury), PREMIUM_PRICE * 2);
        assertEq(usdc.balanceOf(alice), 0);
    }

    function testMintPremiumZeroAmountReverts() public {
        vm.prank(alice);
        vm.expectRevert(AccessPass.AmountZero.selector);
        pass.mintPremium(0);
    }

    function testOnlyOwnerCanSetPremiumPrice() public {
        vm.prank(alice);
        vm.expectRevert();
        pass.setPremiumPrice(200e6);

        vm.prank(owner);
        pass.setPremiumPrice(200e6);
        assertEq(pass.premiumPrice(), 200e6);
    }

    function testOnlyOwnerCanSetTreasury() public {
        vm.prank(alice);
        vm.expectRevert();
        pass.setTreasury(address(0xCAFE));

        vm.prank(owner);
        pass.setTreasury(address(0xCAFE));
        assertEq(pass.treasury(), address(0xCAFE));
    }

    function testSetTreasuryZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert(AccessPass.ZeroAddress.selector);
        pass.setTreasury(address(0));
    }

    function testOnlyOwnerCanSetURI() public {
        vm.prank(alice);
        vm.expectRevert();
        pass.setURI("ipfs://new-base-uri/");

        vm.prank(owner);
        pass.setURI("ipfs://new-base-uri/");
        assertEq(pass.uri(0), "ipfs://new-base-uri/");
    }

    function testOwnershipTransferRequiresAccept() public {
        vm.prank(owner);
        pass.transferOwnership(alice);

        assertEq(pass.owner(), owner);
        assertEq(pass.pendingOwner(), alice);

        vm.prank(bob);
        vm.expectRevert();
        pass.acceptOwnership();

        vm.prank(alice);
        pass.acceptOwnership();

        assertEq(pass.owner(), alice);
    }
}
