const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

router.post("/", companyController.addCompany);
router.get("/search", companyController.searchCompanies);
router.get("/:companySlug", companyController.getCompanyBySlug);

module.exports = router;
