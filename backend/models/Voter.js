const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    isEligible: {
      type: Boolean,
      default: true
    },
    hasVoted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Voter || mongoose.model("Voter", voterSchema);
