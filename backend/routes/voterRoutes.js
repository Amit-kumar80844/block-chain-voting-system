const express = require("express");
const voterController = require("../controllers/voterController");

const router = express.Router();

router.post("/login", voterController.loginVoter);
router.post("/vote", voterController.castVote);

module.exports = router;
