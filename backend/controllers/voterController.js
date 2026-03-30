const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Voter = require("../models/Voter");
const blockchainService = require("../services/blockchainService");
const { hashVoterId, normalizeIdentifier } = require("../utils/hash");

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

exports.loginVoter = async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!voterId) {
      return sendError(
        res,
        400,
        "Voter ID is required.",
        "Missing voter ID."
      );
    }

    const normalizedVoterId = normalizeIdentifier(voterId);
    const voter = await Voter.findOne({ voterId: normalizedVoterId }).lean();

    if (!voter) {
      return sendError(res, 404, "Voter not found.", "Invalid voter ID.");
    }

    if (!voter.isEligible) {
      return sendError(
        res,
        403,
        "This voter is not eligible to vote.",
        "Voter is marked ineligible."
      );
    }

    if (voter.hasVoted) {
      return sendError(
        res,
        409,
        "This voter has already voted.",
        "Duplicate vote blocked."
      );
    }

    const election = await Election.findOne().lean();
    const isElectionActive = Boolean(election?.isElectionActive);

    return sendSuccess(
      res,
      200,
      isElectionActive
        ? "Voter authenticated successfully."
        : "Voter authenticated, but the election is not active yet.",
      {
        voter: {
          voterId: voter.voterId,
          name: voter.name,
          isEligible: voter.isEligible,
          hasVoted: voter.hasVoted
        },
        isElectionActive
      }
    );
  } catch (error) {
    return sendError(res, 500, "Failed to authenticate voter.", error.message);
  }
};

exports.castVote = async (req, res) => {
  try {
    const { voterId, candidateId } = req.body;

    if (!voterId || !candidateId) {
      return sendError(
        res,
        400,
        "Voter ID and candidate ID are required.",
        "Missing required fields."
      );
    }

    const normalizedVoterId = normalizeIdentifier(voterId);
    const normalizedCandidateId = normalizeIdentifier(candidateId);

    const election = await Election.findOne().lean();

    if (!election || !election.isElectionActive) {
      return sendError(
        res,
        400,
        "Election is not active right now.",
        "Voting is currently closed."
      );
    }

    const candidate = await Candidate.findOne({
      candidateId: normalizedCandidateId
    }).lean();

    if (!candidate) {
      return sendError(res, 404, "Candidate not found.", "Invalid candidate ID.");
    }

    const voter = await Voter.findOne({
      voterId: normalizedVoterId
    }).lean();

    if (!voter) {
      return sendError(res, 404, "Voter not found.", "Invalid voter ID.");
    }

    if (!voter.isEligible) {
      return sendError(
        res,
        403,
        "This voter is not eligible to vote.",
        "Voter is marked ineligible."
      );
    }

    if (voter.hasVoted) {
      return sendError(
        res,
        409,
        "This voter has already voted.",
        "Duplicate vote blocked."
      );
    }

    const lockedVoter = await Voter.findOneAndUpdate(
      {
        voterId: normalizedVoterId,
        isEligible: true,
        hasVoted: false
      },
      {
        $set: {
          hasVoted: true
        }
      },
      {
        new: true
      }
    ).lean();

    if (!lockedVoter) {
      return sendError(
        res,
        409,
        "This voter has already voted.",
        "Duplicate vote blocked."
      );
    }

    try {
      const block = await blockchainService.addBlock({
        voterHash: hashVoterId(normalizedVoterId),
        candidateId: normalizedCandidateId
      });

      return sendSuccess(
        res,
        201,
        "Vote cast successfully and stored in the blockchain.",
        {
          blockHash: block.hash,
          blockIndex: block.index,
          block
        }
      );
    } catch (blockError) {
      await Voter.updateOne(
        { voterId: normalizedVoterId },
        {
          $set: {
            hasVoted: false
          }
        }
      );

      return sendError(
        res,
        500,
        "Vote could not be recorded on the blockchain.",
        blockError.message
      );
    }
  } catch (error) {
    return sendError(res, 500, "Failed to cast vote.", error.message);
  }
};
