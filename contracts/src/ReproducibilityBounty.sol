// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ResearchRegistry.sol";

contract ReproducibilityBounty {
    struct Bounty {
        uint256 paperId;
        address poster;
        uint256 amount;
        bool claimed;
        uint256 deadline;
    }

    struct Replication {
        uint256 bountyId;
        address submitter;
        string ipfsCid;
        uint256 votesFor;
        uint256 votesAgainst;
        bool resolved;
    }

    ResearchRegistry public registry;
    Bounty[] public bounties;
    Replication[] public replications;

    mapping(uint256 => uint256[]) public bountyReplications; // bountyId => replicationIds
    mapping(uint256 => mapping(address => bool)) public hasVoted; // replicationId => voter => voted

    uint256 public constant MIN_VOTES = 3;

    event BountyPosted(uint256 indexed bountyId, uint256 indexed paperId, uint256 amount);
    event ReplicationSubmitted(uint256 indexed replicationId, uint256 indexed bountyId);
    event Voted(uint256 indexed replicationId, address voter, bool support);
    event BountyClaimed(uint256 indexed bountyId, uint256 indexed replicationId, address claimant);

    constructor(address _registry) {
        registry = ResearchRegistry(_registry);
    }

    function postBounty(uint256 _paperId, uint256 _deadline) external payable returns (uint256 bountyId) {
        require(msg.value > 0, "need funds");
        (,,,,ResearchRegistry.Status status,,) = registry.getPaper(_paperId);
        require(status == ResearchRegistry.Status.Published, "not published");
        require(_deadline > block.timestamp, "bad deadline");

        bountyId = bounties.length;
        bounties.push(Bounty({
            paperId: _paperId,
            poster: msg.sender,
            amount: msg.value,
            claimed: false,
            deadline: _deadline
        }));

        emit BountyPosted(bountyId, _paperId, msg.value);
    }

    function submitReplication(uint256 _bountyId, string calldata _ipfsCid) external returns (uint256 replicationId) {
        require(_bountyId < bounties.length, "invalid bounty");
        require(!bounties[_bountyId].claimed, "already claimed");
        require(block.timestamp <= bounties[_bountyId].deadline, "expired");

        replicationId = replications.length;
        replications.push(Replication({
            bountyId: _bountyId,
            submitter: msg.sender,
            ipfsCid: _ipfsCid,
            votesFor: 0,
            votesAgainst: 0,
            resolved: false
        }));
        bountyReplications[_bountyId].push(replicationId);

        emit ReplicationSubmitted(replicationId, _bountyId);
    }

    function vote(uint256 _replicationId, bool _support) external {
        require(_replicationId < replications.length, "invalid");
        Replication storage r = replications[_replicationId];
        require(!r.resolved, "resolved");
        require(!hasVoted[_replicationId][msg.sender], "already voted");

        hasVoted[_replicationId][msg.sender] = true;
        if (_support) {
            r.votesFor++;
        } else {
            r.votesAgainst++;
        }

        emit Voted(_replicationId, msg.sender, _support);

        // Auto-resolve if enough votes and majority supports
        if (r.votesFor + r.votesAgainst >= MIN_VOTES && r.votesFor > r.votesAgainst) {
            r.resolved = true;
            Bounty storage b = bounties[r.bountyId];
            if (!b.claimed) {
                b.claimed = true;
                payable(r.submitter).transfer(b.amount);
                emit BountyClaimed(r.bountyId, _replicationId, r.submitter);
            }
        }
    }

    function refundExpired(uint256 _bountyId) external {
        Bounty storage b = bounties[_bountyId];
        require(block.timestamp > b.deadline, "not expired");
        require(!b.claimed, "claimed");
        b.claimed = true;
        payable(b.poster).transfer(b.amount);
    }

    function bountyCount() external view returns (uint256) {
        return bounties.length;
    }

    function replicationCount() external view returns (uint256) {
        return replications.length;
    }

    function getReplicationsForBounty(uint256 _bountyId) external view returns (uint256[] memory) {
        return bountyReplications[_bountyId];
    }
}
