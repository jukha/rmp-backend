const express = require("express");
const savedJobController = require("../controllers/savedJobController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.use(jwtUtility.verifyAuthToken);
router.get("/", savedJobController.getSavedJobsByUser);
router.post("/:jobId", savedJobController.saveJob);

module.exports = router;
