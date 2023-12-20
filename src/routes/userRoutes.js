const express = require("express");
const userController = require("../controllers/userController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/google-auth", userController.googleAuth);

router.post(
  "/save-job/:jobId",
  jwtUtility.verifyAuthToken,
  userController.saveJob
);

module.exports = router;
