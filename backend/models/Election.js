const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    isElectionActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Election || mongoose.model("Election", electionSchema);
