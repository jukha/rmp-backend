const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const jwtUtility = require("../middlewares/JwtUtilis");

router.get("/search", jobController.searchJobs);
router.get("/job-suggestions", jobController.jobSuggestions);
router.get("/:jobSlug", jobController.getJobBySlug);

router.use(jwtUtility.verifyAuthToken);
router.post("/", jobController.addJob);
router.post("/:jobSlug/ratings", jobController.addJobRating);

module.exports = router;
