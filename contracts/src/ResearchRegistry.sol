// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PeerReview.sol";

contract ResearchRegistry {
    enum Status { Submitted, UnderReview, Published, Disputed }

    struct Paper {
        string ipfsCid;
        bytes32 titleHash;
        address[] authors;
        string[] fieldTags;
        Status status;
        uint256 submittedAt;
        address submitter;
    }

    Paper[] public papers;
    PeerReview public peerReview;

    event PaperSubmitted(uint256 indexed paperId, address indexed submitter, string ipfsCid);
    event StatusChanged(uint256 indexed paperId, Status newStatus);

    modifier onlyPeerReview() {
        require(msg.sender == address(peerReview), "only PeerReview");
        _;
    }

    constructor() {}

    function setPeerReview(address _pr) external {
        require(address(peerReview) == address(0), "already set");
        peerReview = PeerReview(_pr);
    }

    function submitPaper(
        string calldata _ipfsCid,
        bytes32 _titleHash,
        address[] calldata _authors,
        string[] calldata _fieldTags
    ) external returns (uint256 paperId) {
        require(bytes(_ipfsCid).length > 0, "empty CID");
        require(_authors.length > 0, "no authors");

        paperId = papers.length;
        Paper storage p = papers.push();
        p.ipfsCid = _ipfsCid;
        p.titleHash = _titleHash;
        p.submitter = msg.sender;
        p.submittedAt = block.timestamp;
        p.status = Status.Submitted;

        for (uint256 i; i < _authors.length; i++) {
            p.authors.push(_authors[i]);
        }
        for (uint256 i; i < _fieldTags.length; i++) {
            p.fieldTags.push(_fieldTags[i]);
        }

        emit PaperSubmitted(paperId, msg.sender, _ipfsCid);
    }

    function setStatus(uint256 _paperId, Status _status) external onlyPeerReview {
        require(_paperId < papers.length, "invalid paper");
        papers[_paperId].status = _status;
        emit StatusChanged(_paperId, _status);
    }

    function setStatusByOwner(uint256 _paperId, Status _status) external {
        require(_paperId < papers.length, "invalid paper");
        require(papers[_paperId].submitter == msg.sender, "not submitter");
        papers[_paperId].status = _status;
        emit StatusChanged(_paperId, _status);
    }

    function getPaper(uint256 _paperId) external view returns (
        string memory ipfsCid,
        bytes32 titleHash,
        address[] memory authors,
        string[] memory fieldTags,
        Status status,
        uint256 submittedAt,
        address submitter
    ) {
        require(_paperId < papers.length, "invalid paper");
        Paper storage p = papers[_paperId];
        return (p.ipfsCid, p.titleHash, p.authors, p.fieldTags, p.status, p.submittedAt, p.submitter);
    }

    function paperCount() external view returns (uint256) {
        return papers.length;
    }
}
