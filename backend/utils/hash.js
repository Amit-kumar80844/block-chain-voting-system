const crypto = require("crypto");

const normalizeIdentifier = (value = "") => String(value).trim().toUpperCase();

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const sortObjectKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortObjectKeys(value[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const stableStringify = (value) => JSON.stringify(sortObjectKeys(value));

const hashVoterId = (voterId) => sha256(normalizeIdentifier(voterId));

module.exports = {
  sha256,
  stableStringify,
  hashVoterId,
  normalizeIdentifier
};
