const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Voter = require("../models/Voter");
const blockchainService = require("../services/blockchainService");
const { normalizeIdentifier } = require("../utils/hash");

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

const handleDuplicateKeyError = (error, fieldLabel) => {
  if (error && error.code === 11000) {
    return `${fieldLabel} already exists.`;
  }

  return null;
};

exports.addVoter = async (req, res) => {
  try {
    const { voterId, name, isEligible } = req.body;

    if (!voterId || !name) {
      return sendError(
        res,
        400,
        "Voter ID and voter name are required.",
        "Missing required fields."
      );
    }

    const voter = await Voter.create({
      voterId: normalizeIdentifier(voterId),
      name: String(name).trim(),
      isEligible:
        typeof isEligible === "boolean" ? isEligible : String(isEligible) !== "false"
    });

    return sendSuccess(res, 201, "Voter added successfully.", voter);
  } catch (error) {
    const duplicateMessage = handleDuplicateKeyError(error, "Voter ID");

    return sendError(
      res,
      duplicateMessage ? 409 : 500,
      duplicateMessage || "Failed to add voter.",
      error.message
    );
  }
};

exports.getVoters = async (req, res) => {
  try {
    const voters = await Voter.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, "Voters fetched successfully.", voters);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch voters.", error.message);
  }
};

exports.addCandidate = async (req, res) => {
  try {
    const { candidateId, name, party } = req.body;

    if (!candidateId || !name) {
      return sendError(
        res,
        400,
        "Candidate ID and candidate name are required.",
        "Missing required fields."
      );
    }

    const candidate = await Candidate.create({
      candidateId: normalizeIdentifier(candidateId),
      name: String(name).trim(),
      party: party ? String(party).trim() : ""
    });

    return sendSuccess(res, 201, "Candidate added successfully.", candidate);
  } catch (error) {
    const duplicateMessage = handleDuplicateKeyError(error, "Candidate ID");

    return sendError(
      res,
      duplicateMessage ? 409 : 500,
      duplicateMessage || "Failed to add candidate.",
      error.message
    );
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, "Candidates fetched successfully.", candidates);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch candidates.", error.message);
  }
};

exports.startElection = async (req, res) => {
  try {
    const candidateCount = await Candidate.countDocuments();

    if (candidateCount === 0) {
      return sendError(
        res,
        400,
        "Add at least one candidate before starting the election.",
        "No candidates available."
      );
    }

    let election = await Election.findOne();

    if (!election) {
      election = await Election.create({
        isElectionActive: false
      });
    }

    if (election.isElectionActive) {
      return sendError(
        res,
        400,
        "Election is already active.",
        "Duplicate action."
      );
    }

    election.isElectionActive = true;
    await election.save();

    return sendSuccess(res, 200, "Election started successfully.", {
      isElectionActive: election.isElectionActive
    });
  } catch (error) {
    return sendError(res, 500, "Failed to start election.", error.message);
  }
};

exports.endElection = async (req, res) => {
  try {
    let election = await Election.findOne();

    if (!election) {
      election = await Election.create({
        isElectionActive: false
      });
    }

    if (!election.isElectionActive) {
      return sendError(
        res,
        400,
        "Election is already inactive.",
        "Duplicate action."
      );
    }

    election.isElectionActive = false;
    await election.save();

    return sendSuccess(res, 200, "Election ended successfully.", {
      isElectionActive: election.isElectionActive
    });
  } catch (error) {
    return sendError(res, 500, "Failed to end election.", error.message);
  }
};

exports.getResults = async (req, res) => {
  try {
    const [election, resultData, chainValid] = await Promise.all([
      Election.findOne().lean(),
      blockchainService.calculateResults(),
      blockchainService.isChainValid()
    ]);

    return sendSuccess(res, 200, "Election results fetched successfully.", {
      election: {
        isElectionActive: Boolean(election?.isElectionActive)
      },
      totalVotes: resultData.totalVotes,
      results: resultData.results,
      chainValid,
      generatedFrom: "blockchain"
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch election results.", error.message);
  }
};
