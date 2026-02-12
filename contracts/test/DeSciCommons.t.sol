// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ResearchRegistry.sol";
import "../src/PeerReview.sol";
import "../src/ResearchFunding.sol";
import "../src/ReproducibilityBounty.sol";

contract DeSciCommonsTest is Test {
    ResearchRegistry registry;
    PeerReview peerReview;
    ResearchFunding funding;
    ReproducibilityBounty bounty;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address dave = makeAddr("dave");

    function setUp() public {
        registry = new ResearchRegistry();
        peerReview = new PeerReview(address(registry), 3);
        registry.setPeerReview(address(peerReview));
        funding = new ResearchFunding(address(registry));
        bounty = new ReproducibilityBounty(address(registry));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave, 100 ether);
    }

    // ─── Registry ───

    function test_submitPaper() public {
        address[] memory authors = new address[](1);
        authors[0] = alice;
        string[] memory tags = new string[](1);
        tags[0] = "biology";

        vm.prank(alice);
        uint256 id = registry.submitPaper("QmTest123", keccak256("My Paper"), authors, tags);
        assertEq(id, 0);
        assertEq(registry.paperCount(), 1);

        (string memory cid,, address[] memory a,, ResearchRegistry.Status s,,) = registry.getPaper(0);
        assertEq(cid, "QmTest123");
        assertEq(a[0], alice);
        assertEq(uint8(s), uint8(ResearchRegistry.Status.Submitted));
    }

    function test_revertEmptyCid() public {
        address[] memory authors = new address[](1);
        authors[0] = alice;
        string[] memory tags = new string[](0);

        vm.prank(alice);
        vm.expectRevert("empty CID");
        registry.submitPaper("", keccak256("x"), authors, tags);
    }

    function test_revertNoAuthors() public {
        address[] memory authors = new address[](0);
        string[] memory tags = new string[](0);

        vm.prank(alice);
        vm.expectRevert("no authors");
        registry.submitPaper("QmX", keccak256("x"), authors, tags);
    }

    // ─── Peer Review ───

    function _submitTestPaper() internal returns (uint256) {
        address[] memory authors = new address[](1);
        authors[0] = alice;
        string[] memory tags = new string[](1);
        tags[0] = "physics";
        vm.prank(alice);
        return registry.submitPaper("QmPaper1", keccak256("Paper 1"), authors, tags);
    }

    function test_submitReview() public {
        uint256 paperId = _submitTestPaper();

        vm.prank(bob);
        uint256 rId = peerReview.submitReview(paperId, "QmReview1", 7);
        assertEq(rId, 0);
        assertEq(peerReview.reviewCount(), 1);

        // Status should be UnderReview
        (,,,,ResearchRegistry.Status s,,) = registry.getPaper(paperId);
        assertEq(uint8(s), uint8(ResearchRegistry.Status.UnderReview));
    }

    function test_autoPublish() public {
        uint256 paperId = _submitTestPaper();

        vm.prank(bob);
        peerReview.submitReview(paperId, "QmR1", 8);
        vm.prank(carol);
        peerReview.submitReview(paperId, "QmR2", 7);
        vm.prank(dave);
        peerReview.submitReview(paperId, "QmR3", 6);

        (,,,,ResearchRegistry.Status s,,) = registry.getPaper(paperId);
        assertEq(uint8(s), uint8(ResearchRegistry.Status.Published));
    }

    function test_noPublishLowScore() public {
        uint256 paperId = _submitTestPaper();

        vm.prank(bob);
        peerReview.submitReview(paperId, "QmR1", 2);
        vm.prank(carol);
        peerReview.submitReview(paperId, "QmR2", 3);
        vm.prank(dave);
        peerReview.submitReview(paperId, "QmR3", 1);

        (,,,,ResearchRegistry.Status s,,) = registry.getPaper(paperId);
        assertEq(uint8(s), uint8(ResearchRegistry.Status.UnderReview)); // not published
    }

    function test_revertDoubleReview() public {
        uint256 paperId = _submitTestPaper();
        vm.prank(bob);
        peerReview.submitReview(paperId, "QmR1", 7);
        vm.prank(bob);
        vm.expectRevert("already reviewed");
        peerReview.submitReview(paperId, "QmR2", 8);
    }

    function test_reviewerReputation() public {
        uint256 paperId = _submitTestPaper();
        vm.prank(bob);
        peerReview.submitReview(paperId, "QmR1", 7);
        assertEq(peerReview.reviewerReputation(bob), 1);
    }

    // ─── Funding ───

    function test_createProposalAndRound() public {
        uint256 paperId = _submitTestPaper();

        uint256[] memory milestones = new uint256[](2);
        milestones[0] = 0.5 ether;
        milestones[1] = 0.5 ether;

        vm.prank(alice);
        uint256 pId = funding.createProposal(paperId, "QmDesc", 1 ether, milestones);
        assertEq(pId, 0);

        uint256[] memory pIds = new uint256[](1);
        pIds[0] = 0;

        vm.prank(bob);
        uint256 rId = funding.createRound{value: 10 ether}(7 days, pIds);
        assertEq(rId, 0);
    }

    function test_contributeAndFinalize() public {
        uint256 paperId = _submitTestPaper();
        uint256[] memory milestones = new uint256[](1);
        milestones[0] = 1 ether;

        vm.prank(alice);
        funding.createProposal(paperId, "QmDesc", 1 ether, milestones);

        uint256[] memory pIds = new uint256[](1);
        pIds[0] = 0;

        vm.prank(dave);
        funding.createRound{value: 5 ether}(1 days, pIds);

        vm.prank(bob);
        funding.contribute{value: 1 ether}(0, 0);
        vm.prank(carol);
        funding.contribute{value: 2 ether}(0, 0);

        vm.warp(block.timestamp + 2 days);
        funding.finalizeRound(0);

        assertEq(funding.roundCount(), 1);
    }

    function test_revertMilestonesMismatch() public {
        uint256[] memory milestones = new uint256[](1);
        milestones[0] = 0.5 ether;

        vm.prank(alice);
        vm.expectRevert("milestones != goal");
        funding.createProposal(0, "QmDesc", 1 ether, milestones);
    }

    // ─── Bounty ───

    function _publishPaper() internal returns (uint256) {
        uint256 paperId = _submitTestPaper();
        vm.prank(bob);
        peerReview.submitReview(paperId, "QmR1", 8);
        vm.prank(carol);
        peerReview.submitReview(paperId, "QmR2", 7);
        vm.prank(dave);
        peerReview.submitReview(paperId, "QmR3", 9);
        return paperId;
    }

    function test_postBounty() public {
        uint256 paperId = _publishPaper();

        vm.prank(alice);
        uint256 bId = bounty.postBounty{value: 1 ether}(paperId, block.timestamp + 30 days);
        assertEq(bId, 0);
        assertEq(bounty.bountyCount(), 1);
    }

    function test_revertBountyNotPublished() public {
        _submitTestPaper();
        vm.prank(alice);
        vm.expectRevert("not published");
        bounty.postBounty{value: 1 ether}(0, block.timestamp + 30 days);
    }

    function test_submitAndClaimReplication() public {
        uint256 paperId = _publishPaper();

        vm.prank(alice);
        bounty.postBounty{value: 1 ether}(paperId, block.timestamp + 30 days);

        vm.prank(bob);
        uint256 rId = bounty.submitReplication(0, "QmReplication1");

        uint256 bobBefore = bob.balance;

        // 3 votes for
        address voter1 = makeAddr("voter1");
        address voter2 = makeAddr("voter2");
        address voter3 = makeAddr("voter3");

        vm.prank(voter1);
        bounty.vote(rId, true);
        vm.prank(voter2);
        bounty.vote(rId, true);
        vm.prank(voter3);
        bounty.vote(rId, true);

        assertEq(bob.balance, bobBefore + 1 ether);
    }

    function test_refundExpiredBounty() public {
        uint256 paperId = _publishPaper();

        vm.prank(alice);
        bounty.postBounty{value: 1 ether}(paperId, block.timestamp + 1 days);

        uint256 aliceBefore = alice.balance;
        vm.warp(block.timestamp + 2 days);
        bounty.refundExpired(0);
        assertEq(alice.balance, aliceBefore + 1 ether);
    }
}
