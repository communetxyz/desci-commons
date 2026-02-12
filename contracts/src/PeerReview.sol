// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ResearchRegistry.sol";

contract PeerReview {
    struct Review {
        uint256 paperId;
        address reviewer;
        string ipfsCid;
        uint8 score; // 1-10
        uint256 submittedAt;
    }

    ResearchRegistry public registry;
    uint256 public minReviews;

    Review[] public reviews;
    mapping(uint256 => uint256[]) public paperReviews; // paperId => reviewIds
    mapping(address => uint256) public reviewerReputation;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;

    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId, address indexed reviewer);
    event PaperPublished(uint256 indexed paperId);

    constructor(address _registry, uint256 _minReviews) {
        registry = ResearchRegistry(_registry);
        minReviews = _minReviews == 0 ? 3 : _minReviews;
    }

    function submitReview(
        uint256 _paperId,
        string calldata _ipfsCid,
        uint8 _score
    ) external returns (uint256 reviewId) {
        require(_score >= 1 && _score <= 10, "score 1-10");
        require(bytes(_ipfsCid).length > 0, "empty CID");
        require(!hasReviewed[_paperId][msg.sender], "already reviewed");

        (,,,,ResearchRegistry.Status status,,) = registry.getPaper(_paperId);
        require(
            status == ResearchRegistry.Status.Submitted || status == ResearchRegistry.Status.UnderReview,
            "not reviewable"
        );

        // Move to UnderReview if first review
        if (status == ResearchRegistry.Status.Submitted) {
            registry.setStatus(_paperId, ResearchRegistry.Status.UnderReview);
        }

        reviewId = reviews.length;
        reviews.push(Review({
            paperId: _paperId,
            reviewer: msg.sender,
            ipfsCid: _ipfsCid,
            score: _score,
            submittedAt: block.timestamp
        }));

        paperReviews[_paperId].push(reviewId);
        hasReviewed[_paperId][msg.sender] = true;
        reviewerReputation[msg.sender]++;

        emit ReviewSubmitted(reviewId, _paperId, msg.sender);

        // Auto-publish if enough reviews with avg score >= 5
        if (paperReviews[_paperId].length >= minReviews) {
            _tryPublish(_paperId);
        }
    }

    function _tryPublish(uint256 _paperId) internal {
        uint256[] storage rIds = paperReviews[_paperId];
        uint256 total;
        for (uint256 i; i < rIds.length; i++) {
            total += reviews[rIds[i]].score;
        }
        if (total / rIds.length >= 5) {
            registry.setStatus(_paperId, ResearchRegistry.Status.Published);
            emit PaperPublished(_paperId);
        }
    }

    function getReviewsForPaper(uint256 _paperId) external view returns (uint256[] memory) {
        return paperReviews[_paperId];
    }

    function reviewCount() external view returns (uint256) {
        return reviews.length;
    }
}
