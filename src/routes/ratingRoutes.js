const express = require("express");
const ratingController = require("../controllers/ratingController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.use(jwtUtility.verifyAuthToken);

router.post("/", ratingController.addRating);
router.get("/", ratingController.getRatings);

module.exports = router;
