// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../libraries/LibDiamond.sol";

library LibDeVote {
    bytes32 constant DEVOTE_STORAGE_POSITION = keccak256("diamond.standard.devote.storage");

    enum Status { Active, Closed, Anchored }

    // -------- Errors --------
    error ErrBadWindow();
    error ErrPollExists(uint256 id);
    error ErrPollNotFound(uint256 id);
    error ErrPollNotActive(uint256 id);
    error ErrPollAlreadyClosed(uint256 id);
    error ErrPollAlreadyAnchored(uint256 id);
    error ErrTooEarly(uint256 nowTs, uint256 endTs);
    error ErrEmptyResultHash();
    error ErrEmptyMetaURI();

    struct Poll{
        bytes32 eligibleRoot;   // allowlist fingerprint
        uint64  start;          // metadata window (enforced at anchor)
        uint64  end;
        string  metaURI;        // IPFS CID
        bytes32 resultHash;     // keccak256(votes.jsonl || 0x1e || tally.json)
        Status  status;         // Active | Closed | Anchored
        address creator;        // existence sentinel; also useful for audit
    }

    struct DeVoteStorage {
        mapping(uint256 => Poll) polls;
    }

    // -------- Events --------
    event PollCreated(
        uint256 indexed id,
        bytes32 indexed eligibleRoot,
        uint64 start,
        uint64 end,
        address indexed creator,
        string metaURI
    );
    event PollAnchored(uint256 indexed id, bytes32 resultHash);
    event PollClosed(uint256 indexed id);

    function deVoteStorage() internal pure returns (DeVoteStorage storage ds) {
        bytes32 position = DEVOTE_STORAGE_POSITION;
        assembly { ds.slot := position }
    }

    // -------- Create --------
    function createPoll(
        uint256 id,
        bytes32 eligibleRoot,
        uint64 start,
        uint64 end,
        string memory metaURI
    ) internal {
        LibDiamond.enforceIsContractOwner();

        if (start >= end) revert ErrBadWindow();
        if (bytes(metaURI).length == 0) revert ErrEmptyMetaURI();

        DeVoteStorage storage ds = deVoteStorage();
        if (ds.polls[id].creator != address(0)) revert ErrPollExists(id);

        ds.polls[id] = Poll({
            eligibleRoot: eligibleRoot,
            start: start,
            end: end,
            metaURI: metaURI,
            resultHash: bytes32(0),
            status: Status.Active,
            creator: msg.sender
        });

        emit PollCreated(id, eligibleRoot, start, end, msg.sender, metaURI);
    }

    // -------- Anchor (finalize) --------
    function anchorResult(uint256 id, bytes32 _resultHash) internal {
        LibDiamond.enforceIsContractOwner();

        DeVoteStorage storage ds = deVoteStorage();
        Poll storage p = ds.polls[id];

        if (p.creator == address(0)) revert ErrPollNotFound(id);
        if (p.status == Status.Closed) revert ErrPollAlreadyClosed(id);
        if (p.status == Status.Anchored) revert ErrPollAlreadyAnchored(id);
        if (_resultHash == bytes32(0)) revert ErrEmptyResultHash();

        // Enforce that anchoring can't happen before configured end
        if (block.timestamp < p.end) revert ErrTooEarly(block.timestamp, p.end);

        p.resultHash = _resultHash;
        p.status = Status.Anchored;

        emit PollAnchored(id, _resultHash);
    }

    // -------- Read --------
    function getPoll(uint256 id) internal view returns (Poll memory poll) {
        DeVoteStorage storage ds = deVoteStorage();
        poll = ds.polls[id];
        if (poll.creator == address(0)) revert ErrPollNotFound(id);
    }

    // -------- Close (invalidate) --------
    function closePoll(uint256 id) internal {
        LibDiamond.enforceIsContractOwner();

        DeVoteStorage storage ds = deVoteStorage();
        Poll storage p = ds.polls[id];

        if (p.creator == address(0)) revert ErrPollNotFound(id);
        if (p.status != Status.Active) revert ErrPollNotActive(id);
        // No time check here: "Closed" = terminated/invalid any time before anchoring

        p.status = Status.Closed;

        emit PollClosed(id);
    }
}
