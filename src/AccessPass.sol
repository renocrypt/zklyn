// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AccessPass is ERC1155, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FREE_PASS_ID = 0;
    uint256 public constant PREMIUM_PASS_ID = 1;

    IERC20 public immutable usdc;
    address public treasury;
    uint256 public premiumPrice;

    mapping(address => bool) public freeClaimed;

    error FreeAlreadyClaimed();
    error AmountZero();
    error ZeroAddress();

    event FreePassClaimed(address indexed account);
    event PremiumPassMinted(address indexed account, uint256 amount, uint256 totalPaid);
    event PremiumPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(address usdc_, address treasury_, uint256 premiumPrice_, string memory baseUri)
        ERC1155(baseUri)
        Ownable(msg.sender)
    {
        if (usdc_ == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        usdc = IERC20(usdc_);
        treasury = treasury_;
        premiumPrice = premiumPrice_;
    }

    function setPremiumPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = premiumPrice;
        premiumPrice = newPrice;
        emit PremiumPriceUpdated(oldPrice, newPrice);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) {
            revert ZeroAddress();
        }
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }

    function claimFree() external nonReentrant {
        if (freeClaimed[msg.sender]) {
            revert FreeAlreadyClaimed();
        }
        freeClaimed[msg.sender] = true;
        _mint(msg.sender, FREE_PASS_ID, 1, "");
        emit FreePassClaimed(msg.sender);
    }

    function mintPremium(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert AmountZero();
        }
        uint256 cost = premiumPrice * amount;
        usdc.safeTransferFrom(msg.sender, treasury, cost);
        _mint(msg.sender, PREMIUM_PASS_ID, amount, "");
        emit PremiumPassMinted(msg.sender, amount, cost);
    }
}
