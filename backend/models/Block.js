const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true
    },
    timestamp: {
      type: String,
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    previousHash: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    nonce: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.models.Block || mongoose.model("Block", blockSchema);
