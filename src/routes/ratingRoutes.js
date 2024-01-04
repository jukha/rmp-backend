const express = require("express");
const ratingController = require("../controllers/ratingController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.get("/:id", ratingController.getRating);

router.use(jwtUtility.verifyAuthToken);

router.post("/", ratingController.addRating);

router.patch("/update-feedback", ratingController.updateRatingFeedback);

router.patch("/report-rating", ratingController.reportARating);

router.get("/", ratingController.getRatings);

module.exports = router;
