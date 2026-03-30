const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

router.get("/candidates", publicController.getPublicCandidates);
router.get("/results", publicController.getPublicResults);
router.get("/blockchain", publicController.getBlockchain);
router.get("/blockchain/verify", publicController.verifyBlockchain);

module.exports = router;
