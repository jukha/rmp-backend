const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const jwtUtility = require("../middlewares/JwtUtilis");

router.get("/search", companyController.searchCompanies);
router.get("/company-suggestions", companyController.companySuggestions);
router.get("/:companySlug", companyController.getCompanyBySlug);

router.use(jwtUtility.verifyAuthToken);
router.post("/", companyController.addCompany);

module.exports = router;
