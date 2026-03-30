const Block = require("../models/Block");
const Candidate = require("../models/Candidate");
const { sha256, stableStringify } = require("../utils/hash");

class BlockchainService {
  constructor() {
    this.difficulty = 2;
  }

  createGenesisBlock() {
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: {
        message: "Genesis Block"
      },
      previousHash: "0",
      nonce: 0,
      hash: ""
    };

    genesisBlock.hash = this.mineBlock(genesisBlock, this.difficulty);
    return genesisBlock;
  }

  async initializeChain() {
    const existingBlocks = await Block.countDocuments();

    if (existingBlocks === 0) {
      const genesisBlock = this.createGenesisBlock();
      await Block.create(genesisBlock);
      console.log("Genesis block created.");
    }

    return this.getChain();
  }

  async getChain() {
    return Block.find().sort({ index: 1 }).lean();
  }

  async getLatestBlock() {
    return Block.findOne().sort({ index: -1 }).lean();
  }

  calculateHash(block) {
    return sha256(
      `${block.index}${block.timestamp}${stableStringify(block.data)}${block.previousHash}${block.nonce}`
    );
  }

  mineBlock(block, difficulty = this.difficulty) {
    const targetPrefix = "0".repeat(difficulty);
    let hash = this.calculateHash(block);

    while (!hash.startsWith(targetPrefix)) {
      block.nonce += 1;
      hash = this.calculateHash(block);
    }

    return hash;
  }

  async addBlock(data) {
    let latestBlock = await this.getLatestBlock();

    if (!latestBlock) {
      await this.initializeChain();
      latestBlock = await this.getLatestBlock();
    }

    const newBlock = {
      index: latestBlock.index + 1,
      timestamp: new Date().toISOString(),
      data,
      previousHash: latestBlock.hash,
      nonce: 0,
      hash: ""
    };

    newBlock.hash = this.mineBlock(newBlock, this.difficulty);
    const savedBlock = await Block.create(newBlock);
    return savedBlock.toObject();
  }

  async isChainValid() {
    const blocks = await this.getChain();

    if (blocks.length === 0) {
      return false;
    }

    const targetPrefix = "0".repeat(this.difficulty);

    for (let index = 0; index < blocks.length; index += 1) {
      const currentBlock = blocks[index];
      const recalculatedHash = this.calculateHash({
        index: currentBlock.index,
        timestamp: currentBlock.timestamp,
        data: currentBlock.data,
        previousHash: currentBlock.previousHash,
        nonce: currentBlock.nonce
      });

      if (currentBlock.hash !== recalculatedHash) {
        return false;
      }

      if (!currentBlock.hash.startsWith(targetPrefix)) {
        return false;
      }

      if (index === 0) {
        if (currentBlock.index !== 0 || currentBlock.previousHash !== "0") {
          return false;
        }

        continue;
      }

      const previousBlock = blocks[index - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  async calculateResults() {
    const [blocks, candidates] = await Promise.all([
      this.getChain(),
      Candidate.find().sort({ name: 1 }).lean()
    ]);

    const voteCounter = new Map();

    for (const block of blocks) {
      if (block.index === 0) {
        continue;
      }

      const candidateId = block.data?.candidateId;

      if (!candidateId) {
        continue;
      }

      voteCounter.set(candidateId, (voteCounter.get(candidateId) || 0) + 1);
    }

    const results = candidates
      .map((candidate) => ({
        candidateId: candidate.candidateId,
        name: candidate.name,
        party: candidate.party || "Independent",
        votes: voteCounter.get(candidate.candidateId) || 0
      }))
      .sort((firstCandidate, secondCandidate) => {
        if (secondCandidate.votes !== firstCandidate.votes) {
          return secondCandidate.votes - firstCandidate.votes;
        }

        return firstCandidate.name.localeCompare(secondCandidate.name);
      });

    const totalVotes = results.reduce(
      (sum, candidate) => sum + candidate.votes,
      0
    );

    return {
      totalVotes,
      results
    };
  }

  /*
  async tamperBlock(blockIndex, updatedData) {
    return Block.findOneAndUpdate(
      { index: blockIndex },
      { $set: { data: updatedData } },
      { new: true }
    );
  }
  */
}

module.exports = new BlockchainService();
