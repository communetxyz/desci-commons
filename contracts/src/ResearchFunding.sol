// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ResearchRegistry.sol";

contract ResearchFunding {
    struct Proposal {
        uint256 paperId;
        address proposer;
        string description; // IPFS CID
        uint256 fundingGoal;
        uint256 totalRaised;
        uint256[] milestoneAmounts;
        uint256 milestonesReleased;
        bool finalized;
    }

    struct FundingRound {
        uint256 matchingPool;
        uint256 startTime;
        uint256 endTime;
        uint256[] proposalIds;
        bool finalized;
    }

    ResearchRegistry public registry;
    Proposal[] public proposals;
    FundingRound[] public rounds;

    // roundId => proposalId => contributor => amount
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public contributions;
    // roundId => proposalId => contributor list
    mapping(uint256 => mapping(uint256 => address[])) public contributors;
    // roundId => proposalId => total contributed
    mapping(uint256 => mapping(uint256 => uint256)) public roundContributions;

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed paperId);
    event RoundCreated(uint256 indexed roundId, uint256 endTime);
    event Contributed(uint256 indexed roundId, uint256 indexed proposalId, address contributor, uint256 amount);
    event RoundFinalized(uint256 indexed roundId);
    event MilestoneReleased(uint256 indexed proposalId, uint256 milestoneIndex, uint256 amount);

    constructor(address _registry) {
        registry = ResearchRegistry(_registry);
    }

    function createProposal(
        uint256 _paperId,
        string calldata _description,
        uint256 _fundingGoal,
        uint256[] calldata _milestoneAmounts
    ) external returns (uint256 proposalId) {
        uint256 total;
        for (uint256 i; i < _milestoneAmounts.length; i++) {
            total += _milestoneAmounts[i];
        }
        require(total == _fundingGoal, "milestones != goal");

        proposalId = proposals.length;
        Proposal storage p = proposals.push();
        p.paperId = _paperId;
        p.proposer = msg.sender;
        p.description = _description;
        p.fundingGoal = _fundingGoal;
        for (uint256 i; i < _milestoneAmounts.length; i++) {
            p.milestoneAmounts.push(_milestoneAmounts[i]);
        }

        emit ProposalCreated(proposalId, _paperId);
    }

    function createRound(uint256 _duration, uint256[] calldata _proposalIds) external payable returns (uint256 roundId) {
        require(msg.value > 0, "need matching pool");
        roundId = rounds.length;
        FundingRound storage r = rounds.push();
        r.matchingPool = msg.value;
        r.startTime = block.timestamp;
        r.endTime = block.timestamp + _duration;
        for (uint256 i; i < _proposalIds.length; i++) {
            r.proposalIds.push(_proposalIds[i]);
        }
        emit RoundCreated(roundId, r.endTime);
    }

    function contribute(uint256 _roundId, uint256 _proposalId) external payable {
        require(_roundId < rounds.length, "invalid round");
        FundingRound storage r = rounds[_roundId];
        require(block.timestamp <= r.endTime, "round ended");
        require(!r.finalized, "finalized");
        require(msg.value > 0, "zero value");

        if (contributions[_roundId][_proposalId][msg.sender] == 0) {
            contributors[_roundId][_proposalId].push(msg.sender);
        }
        contributions[_roundId][_proposalId][msg.sender] += msg.value;
        roundContributions[_roundId][_proposalId] += msg.value;

        emit Contributed(_roundId, _proposalId, msg.sender, msg.value);
    }

    /// @notice Finalize round using quadratic funding formula
    function finalizeRound(uint256 _roundId) external {
        FundingRound storage r = rounds[_roundId];
        require(block.timestamp > r.endTime, "not ended");
        require(!r.finalized, "already finalized");
        r.finalized = true;

        // Calculate quadratic funding: sum of sqrt(contributions) squared
        uint256 totalQF;
        uint256[] memory qfScores = new uint256[](r.proposalIds.length);

        for (uint256 i; i < r.proposalIds.length; i++) {
            uint256 pid = r.proposalIds[i];
            address[] storage contribs = contributors[_roundId][pid];
            uint256 sumSqrt;
            for (uint256 j; j < contribs.length; j++) {
                sumSqrt += _sqrt(contributions[_roundId][pid][contribs[j]]);
            }
            qfScores[i] = sumSqrt * sumSqrt;
            totalQF += qfScores[i];
        }

        // Distribute matching pool proportionally
        for (uint256 i; i < r.proposalIds.length; i++) {
            if (totalQF > 0) {
                uint256 matched = (r.matchingPool * qfScores[i]) / totalQF;
                uint256 pid = r.proposalIds[i];
                proposals[pid].totalRaised += roundContributions[_roundId][pid] + matched;
            }
        }

        emit RoundFinalized(_roundId);
    }

    function releaseMilestone(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(msg.sender == p.proposer, "not proposer");
        require(p.milestonesReleased < p.milestoneAmounts.length, "all released");
        uint256 idx = p.milestonesReleased;
        uint256 amount = p.milestoneAmounts[idx];
        require(p.totalRaised >= amount, "insufficient funds");
        p.milestonesReleased++;
        p.totalRaised -= amount;
        payable(p.proposer).transfer(amount);
        emit MilestoneReleased(_proposalId, idx, amount);
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function roundCount() external view returns (uint256) {
        return rounds.length;
    }

    receive() external payable {}
}
