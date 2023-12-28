const express = require("express");
const userController = require("../controllers/userController");
const jwtUtility = require("../middlewares/JwtUtilis");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/google-auth", userController.googleAuth);

router.use(jwtUtility.verifyAuthToken);
router.get("/rated-jobs-companies", userController.getRatedJobsAndCompanies);
router.patch("/update", userController.updateUser);

module.exports = router;
