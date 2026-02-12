// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ResearchRegistry.sol";
import "../src/PeerReview.sol";
import "../src/ResearchFunding.sol";
import "../src/ReproducibilityBounty.sol";

contract DeployScript is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);

        ResearchRegistry registry = new ResearchRegistry();
        PeerReview peerReview = new PeerReview(address(registry), 3);
        registry.setPeerReview(address(peerReview));
        ResearchFunding funding = new ResearchFunding(address(registry));
        ReproducibilityBounty bounty = new ReproducibilityBounty(address(registry));

        vm.stopBroadcast();

        console.log("Registry:", address(registry));
        console.log("PeerReview:", address(peerReview));
        console.log("Funding:", address(funding));
        console.log("Bounty:", address(bounty));
    }
}
