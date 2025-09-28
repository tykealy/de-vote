// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import { LibDeVote } from  "../libraries/LibDeVote.sol";
import { LibDiamond } from  "../libraries/LibDiamond.sol";
import { IDeVote } from "../interfaces/IDeVote.sol";

contract DeVoteFacet is IDeVote {

    function createPoll( uint256 id, bytes32 eligibleRoot, uint64 start,uint64 end, string calldata metaURI ) external {
        LibDiamond.enforceIsContractOwner();
        LibDeVote.createPoll(id, eligibleRoot, start,end,metaURI);
    }    

    function anchorResult(uint256 id, bytes32 _resultHash) external {
        LibDiamond.enforceIsContractOwner();
        LibDeVote.anchorResult(id, _resultHash);
    }

    function getPoll(uint256 id ) external view returns(LibDeVote.Poll memory poll){
        LibDiamond.enforceIsContractOwner();
        return LibDeVote.getPoll(id);
    }

    function closePoll(uint256 id) external {
        LibDiamond.enforceIsContractOwner();
        LibDeVote.closePoll(id);
    }
}