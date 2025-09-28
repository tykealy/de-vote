// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDeVote } from "../libraries/LibDeVote.sol";

interface IDeVote {

    /// @notice Create a new poll
    /// @param id Unique poll identifier
    /// @param eligibleRoot Merkle root of eligible voters
    /// @param start Poll start timestamp
    /// @param end Poll end timestamp  
    /// @param metaURI IPFS CID for poll metadata
    function createPoll(uint256 id, bytes32 eligibleRoot, uint64 start, uint64 end, string calldata metaURI) external;

    /// @notice Anchor the result of a poll
    /// @param id Unique poll identifier
    /// @param _resultHash Hash of the result
    /// @dev Poll must be active
    function anchorResult(uint256 id, bytes32 _resultHash) external;

    /// @notice Get a poll
    /// @param id Unique poll identifier
    /// @return poll Poll details
    function getPoll(uint256 id) external view returns (LibDeVote.Poll memory);

    /// @notice Close a poll
    /// @param id Unique poll identifier
    /// @dev Poll must be active
    function closePoll(uint256 id) external;
}