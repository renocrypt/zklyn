// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AccessPass} from "../src/AccessPass.sol";

contract DeployAccessPass is Script {
    function run() external returns (AccessPass pass) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint256 price = vm.envUint("PREMIUM_PRICE");
        string memory baseUri = vm.envString("BASE_URI");

        vm.startBroadcast();
        pass = new AccessPass(usdc, treasury, price, baseUri);
        vm.stopBroadcast();
    }
}
