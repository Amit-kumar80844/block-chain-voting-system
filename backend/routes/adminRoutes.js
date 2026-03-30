const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.post("/voters", adminController.addVoter);
router.get("/voters", adminController.getVoters);
router.post("/candidates", adminController.addCandidate);
router.get("/candidates", adminController.getCandidates);
router.post("/election/start", adminController.startElection);
router.post("/election/end", adminController.endElection);
router.get("/results", adminController.getResults);

module.exports = router;
