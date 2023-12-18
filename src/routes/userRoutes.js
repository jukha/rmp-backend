const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);

// Google OAuth routes
router.get("/auth/google", userController.googleAuth);
router.get("/auth/google/callback", userController.googleCallback);

module.exports = router;
