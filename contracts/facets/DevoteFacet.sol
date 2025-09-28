// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDeVote } from "../libraries/LibDeVote.sol";
import { IDeVote }    from "../interfaces/IDeVote.sol";

/// @notice DeVote diamond facet (owner-only create/anchor/close).
/// @dev Mutating functions delegate to LibDeVote which enforces diamond owner.
contract DeVoteFacet is IDeVote {
    /// ----------------- Core -----------------

    /// @inheritdoc IDeVote
    function createPoll(
        uint256 id,
        bytes32 eligibleRoot,
        uint64 start,
        uint64 end,
        string calldata metaURI
    ) external {
        // calldata -> memory copy happens inside LibDeVote
        LibDeVote.createPoll(id, eligibleRoot, start, end, metaURI);
    }

    /// @inheritdoc IDeVote
    function anchorResult(uint256 id, bytes32 _resultHash) external {
        LibDeVote.anchorResult(id, _resultHash);
    }

    /// @inheritdoc IDeVote
    function closePoll(uint256 id) external {
        LibDeVote.closePoll(id);
    }

    /// @inheritdoc IDeVote
    function getPoll(uint256 id) external view returns (LibDeVote.Poll memory poll) {
        return LibDeVote.getPoll(id);
    }

    /// ----------------- Convenience views (UI-friendly) -----------------

    /// @notice Lightweight status getter so UIs don’t have to decode the struct.
    function status(uint256 id) external view returns (LibDeVote.Status) {
        return LibDeVote.getPoll(id).status;
    }

    /// @notice Return fields as a tuple (some SDKs prefer this over a struct).
    function getPollFields(uint256 id)
        external
        view
        returns (
            bytes32 eligibleRoot,
            uint64 start,
            uint64 end,
            string memory metaURI,
            bytes32 resultHash,
            LibDeVote.Status status_,
            address creator
        )
    {
        LibDeVote.Poll memory p = LibDeVote.getPoll(id);
        return (p.eligibleRoot, p.start, p.end, p.metaURI, p.resultHash, p.status, p.creator);
    }
}
