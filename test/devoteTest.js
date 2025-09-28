
import hre from 'hardhat'
import { deployDiamond } from '../scripts/deploy.js'
import { assert, expect } from 'chai'


describe('DeVoteTest', async () => {
  let ethers
  let diamondAddress
  let devote
  let accounts
  let owner

  before(async function () {
    ({ ethers } = await hre.network.connect())
    accounts = await ethers.getSigners()
    owner = accounts[0]
    diamondAddress = await deployDiamond()
    devote = await ethers.getContractAt('DeVoteFacet', diamondAddress)
  })

  describe('Poll Creation', () => {
    it('should create a poll successfully', async () => {
      const pollId = 1
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000) // Current timestamp
      const end = start + 3600 // 1 hour later
      const metaURI = 'QmTest123'

      await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)
      
      const poll = await devote.getPoll(pollId)
      assert.equal(poll.eligibleRoot, eligibleRoot)
      assert.equal(poll.start, start)
      assert.equal(poll.end, end)
      assert.equal(poll.metaURI, metaURI)
      assert.equal(poll.status, 0) // Status.Active
      assert.equal(poll.resultHash, '0x0000000000000000000000000000000000000000000000000000000000000000')
    })

    it('should fail to create poll with invalid time window', async () => {
      const pollId = 2
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const end = start - 1800 // 30 minutes before start (invalid)
      const metaURI = 'QmTest456'

      let errorOccurred = false
      try {
        await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })

    it('should fail to create poll with duplicate ID', async () => {
      const pollId = 1 // Same ID as first test
      const eligibleRoot = '0x5678901234567890123456789012345678901234567890123456789012345678'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmTest789'

      let errorOccurred = false
      try {
        await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })
  })

  describe('Poll Management', () => {
    it('should anchor a result successfully', async () => {
      // Create a fresh poll for this test
      const pollId = Math.floor(Math.random() * 1000000) + 100
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmTestPoll'
      
      await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)

      const resultHash = '0xabcdef1234567890123456789012345678901234567890123456789012345678'

      await devote.anchorResult(pollId, resultHash)
      
      const poll = await devote.getPoll(pollId)
      assert.equal(poll.resultHash, resultHash)
      assert.equal(poll.status, 2) // Status.Anchored
    })

    it('should close a poll successfully', async () => {
      // Create a fresh poll for this test
      const pollId = Math.floor(Math.random() * 1000000) + 200
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmTestPoll'
      
      await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)

      await devote.closePoll(pollId)
      
      const poll = await devote.getPoll(pollId)
      assert.equal(poll.status, 1) // Status.Closed
    })

    it('should fail to anchor result on non-active poll', async () => {
      // Create a fresh poll for this test
      const pollId = Math.floor(Math.random() * 1000000) + 300
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmTestPoll'
      
      await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)

      const resultHash = '0xabcdef1234567890123456789012345678901234567890123456789012345678'

      // First close the poll
      await devote.closePoll(pollId)
      
      // Then try to anchor result - should fail
      let errorOccurred = false
      try {
        await devote.anchorResult(pollId, resultHash)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })

    it('should fail to close non-active poll', async () => {
      // Create a fresh poll for this test
      const pollId = Math.floor(Math.random() * 1000000) + 400
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmTestPoll'
      
      await devote.createPoll(pollId, eligibleRoot, start, end, metaURI)

      // First close the poll
      await devote.closePoll(pollId)
      
      // Then try to close again - should fail
      let errorOccurred = false
      try {
        await devote.closePoll(pollId)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })
  })

  describe('Poll Retrieval', () => {
    it('should return empty poll for non-existent ID', async () => {
      const nonExistentId = 999999
      const poll = await devote.getPoll(nonExistentId)
      
      assert.equal(poll.eligibleRoot, '0x0000000000000000000000000000000000000000000000000000000000000000')
      assert.equal(poll.start, 0)
      assert.equal(poll.end, 0)
      assert.equal(poll.metaURI, '')
      assert.equal(poll.resultHash, '0x0000000000000000000000000000000000000000000000000000000000000000')
      assert.equal(poll.status, 0)
    })
  })

  describe('Access Control', () => {
    it('should fail when non-owner tries to create poll', async () => {
      const nonOwner = accounts[1]
      const devoteAsNonOwner = devote.connect(nonOwner)
      
      const pollId = 9999
      const eligibleRoot = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const start = Math.floor(Date.now() / 1000)
      const end = start + 3600
      const metaURI = 'QmUnauthorized'

      let errorOccurred = false
      try {
        await devoteAsNonOwner.createPoll(pollId, eligibleRoot, start, end, metaURI)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })

    it('should fail when non-owner tries to anchor result', async () => {
      const nonOwner = accounts[1]
      const devoteAsNonOwner = devote.connect(nonOwner)
      
      const pollId = 1 // Use existing poll
      const resultHash = '0xabcdef1234567890123456789012345678901234567890123456789012345678'

      let errorOccurred = false
      try {
        await devoteAsNonOwner.anchorResult(pollId, resultHash)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })

    it('should fail when non-owner tries to close poll', async () => {
      const nonOwner = accounts[1]
      const devoteAsNonOwner = devote.connect(nonOwner)
      
      const pollId = 1 // Use existing poll

      let errorOccurred = false
      try {
        await devoteAsNonOwner.closePoll(pollId)
      } catch (error) {
        errorOccurred = true
      }
      expect(errorOccurred).to.be.true
    })
  })
})