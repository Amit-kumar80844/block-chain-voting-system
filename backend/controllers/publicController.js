const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const blockchainService = require("../services/blockchainService");

const sendSuccess = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    error
  });
};

exports.getPublicCandidates = async (req, res) => {
  try {
    const [candidates, election] = await Promise.all([
      Candidate.find().sort({ name: 1 }).lean(),
      Election.findOne().lean()
    ]);

    return sendSuccess(res, 200, "Candidates fetched successfully.", {
      isElectionActive: Boolean(election?.isElectionActive),
      candidates
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch candidates.", error.message);
  }
};

exports.getPublicResults = async (req, res) => {
  try {
    const [election, resultData] = await Promise.all([
      Election.findOne().lean(),
      blockchainService.calculateResults()
    ]);

    return sendSuccess(res, 200, "Public results fetched successfully.", {
      election: {
        isElectionActive: Boolean(election?.isElectionActive)
      },
      totalVotes: resultData.totalVotes,
      results: resultData.results
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch public results.", error.message);
  }
};

exports.getBlockchain = async (req, res) => {
  try {
    const chain = await blockchainService.getChain();

    return sendSuccess(res, 200, "Blockchain fetched successfully.", {
      totalBlocks: chain.length,
      chain
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch blockchain.", error.message);
  }
};

exports.verifyBlockchain = async (req, res) => {
  try {
    const valid = await blockchainService.isChainValid();

    return sendSuccess(
      res,
      200,
      valid
        ? "Blockchain integrity is intact."
        : "Blockchain integrity verification failed.",
      {
        valid
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Failed to verify blockchain integrity.",
      error.message
    );
  }
};
