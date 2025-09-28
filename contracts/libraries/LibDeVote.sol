// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibDeVote {

    bytes32 constant DEVOTE_STORAGE_POSITION = keccak256("diamond.standard.devote.storage");
    enum Status {  Active, Closed, Anchored }

    struct Poll{
        bytes32 eligibleRoot;  // fixed allowlist fingerprint
        uint64  start;         // voting opens
        uint64  end;           // voting closes
        string  metaURI;       // IPFS CID for human-readable details
        bytes32 resultHash;    // keccak256(votes.jsonl || 0x1e || tally.json)
        Status status;
    }

    struct DeVoteStorage {
        mapping(uint256 =>Poll) polls;
    }

    event PollCreated(uint256 id, bytes32 eligibleRoot, uint64 start, uint64 end, string metaURI);
    event PollAnchored(uint256 id, bytes32 resultHash);
    event PollClosed(uint256 id);

    function deVoteStorage() internal pure returns (DeVoteStorage storage ds) {
        bytes32 position = DEVOTE_STORAGE_POSITION;
        // assigns struct storage slot to the storage position
        assembly {
            ds.slot := position
        }
    }

    function createPoll( uint256 id, bytes32 eligibleRoot, uint64 start,uint64 end, string calldata metaURI ) internal {
        require(start < end, "bad window");
        DeVoteStorage storage ds = deVoteStorage();
        require(ds.polls[id].end == 0, "poll exists");

        ds.polls[id] = Poll({
            eligibleRoot: eligibleRoot,
            start: start,
            end: end,
            metaURI: metaURI,
            resultHash: bytes32(0),
            status: Status.Active
        });
        emit PollCreated(id, eligibleRoot, start, end, metaURI);
    }

    function anchorResult(uint256 id, bytes32 _resultHash) internal{
        DeVoteStorage storage ds = deVoteStorage();
        require(ds.polls[id].status == Status.Active, "poll not active");
        ds.polls[id].resultHash = _resultHash;
        ds.polls[id].status = Status.Anchored;
        emit PollAnchored(id, _resultHash);
    }

    function getPoll(uint256 id ) internal view returns(Poll memory poll){
        DeVoteStorage storage ds = deVoteStorage();
        
        return ds.polls[id];
    }

    function closePoll(uint256 id) internal{
        DeVoteStorage storage ds = deVoteStorage();
        require(ds.polls[id].status == Status.Active, "poll not active");
        ds.polls[id].status = Status.Closed;
        emit PollClosed(id);
    }
}