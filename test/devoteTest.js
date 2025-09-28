
import hre from 'hardhat'
import { deployDiamond } from '../scripts/deploy.js'
import { FacetCutAction } from '../scripts/libraries/diamond.js'
import { assert } from 'chai'


describe('DeVoteTest', async () => {
  let ethers
  let diamondAddress
  let tx
  let receipt
  let result

  before(async function () {
    ({ ethers } = await hre.network.connect())
    diamondAddress = await deployDiamond()
    devote = await ethers.getContractAt('DeVoteFacet', diamondAddress)
  })
  
  it('should create a poll', async () => {
    await diamondCutFacet.createPoll(1, '0x1234567890123456789012345678901234567890123456789012345678901234', 0, 1, 'test')
    assert.equal(await diamondLoupeFacet.getPoll(1), '0x1234567890123456789012345678901234567890123456789012345678901234')
  })

  it('should anchor a result', async () => {
    await diamondCutFacet.anchorResult(1, '0x1234567890123456789012345678901234567890123456789012345678901234')
    assert.equal(await diamondLoupeFacet.getPoll(1), '0x1234567890123456789012345678901234567890123456789012345678901234')
  })
  
  it('should close a poll', async () => {
    await diamondCutFacet.closePoll(1)
    assert.equal(await diamondLoupeFacet.getPoll(1), '0x1234567890123456789012345678901234567890123456789012345678901234')
  })

})