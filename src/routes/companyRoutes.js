const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const jwtUtility = require("../middlewares/JwtUtilis");

router.get("/search", companyController.searchCompanies);
router.get("/:companySlug", companyController.getCompanyBySlug);

router.use(jwtUtility.verifyAuthToken);
router.post("/", companyController.addCompany);
router.post("/:companySlug/ratings", companyController.addRating);

module.exports = router;
