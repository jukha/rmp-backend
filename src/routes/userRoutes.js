const express = require("express");
const userController = require("../controllers/userController");
const savedJobController = require("../controllers/savedJobController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/google-auth", userController.googleAuth);

router.patch("/update", jwtUtility.verifyAuthToken, userController.updateUser);

module.exports = router;
