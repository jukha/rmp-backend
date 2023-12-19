const Company = require("../models/companyModel");

exports.addCompany = async (req, res) => {
  try {
    const { name, description, location } = req.body;

    const newCompany = new Company({
      name: name,
      description: description,
      location: location,
      ratings: [],
    });

    const savedCompany = await newCompany.save();

    return res.status(201).json({
      success: true,
      data: savedCompany,
      message: "Company added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getCompanyBySlug = async (req, res) => {
  try {
    const companySlug = req.params.companySlug;

    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const overallRating = company.calculateOverallRating();

    return res.status(200).json({
      success: true,
      data: {
        company: company,
        overallRating: overallRating,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.searchCompanies = async (req, res) => {
  try {
    const keyword = req.query.q;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required for searching companies",
      });
    }

    const companies = await Company.find({ $text: { $search: keyword } });

    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addRating = async (req, res) => {
  try {
    const companySlug = req.params.companySlug;

    const {
      reputation,
      companyCulture,
      opportunitiesForAdvancement,
      workLifeBalance,
      employeeBenefits,
      leadershipAndManagement,
      innovationAndTechnologyAdoption,
      diversityAndInclusion,
      corporateSocialResponsibility,
      financialStability,
    } = req.body;

    // Use req.user to get the user information from the decoded token
    const { _id: userId } = req.user;

    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const newRating = {
      user: userId,
      reputation,
      companyCulture,
      opportunitiesForAdvancement,
      workLifeBalance,
      employeeBenefits,
      leadershipAndManagement,
      innovationAndTechnologyAdoption,
      diversityAndInclusion,
      corporateSocialResponsibility,
      financialStability,
    };

    company.addRating(newRating);

    await company.save();

    return res.status(201).json({
      success: true,
      data: company,
      message: "Rating added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
