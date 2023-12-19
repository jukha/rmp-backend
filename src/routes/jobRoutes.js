const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

router.post("/", jobController.addJob);
router.get("/search", jobController.searchJobs);
router.get("/:jobSlug", jobController.getJobBySlug);

module.exports = router;
