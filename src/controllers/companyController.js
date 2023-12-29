const Company = require("../models/companyModel");
const ratingsUtil = require("../utils/getRatingsByType");

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

    // Array to store promises
    const promises = [];

    // Fetch ratings using utility function
    promises.push(
      (async () => {
        const { success, data } = await ratingsUtil.getRatings(
          "company",
          company._id
        );

        if (!success) {
          return res.status(404).json({ success: false, message: data });
        }

        const companyWithRatingsData = {
          ...company.toObject(),
          ratings: data.ratings,
          overallAvgRating: data.overallAvgRating,
          parametersAvgRatings: data.parametersAvgRatings,
        };

        return {
          success: true,
          data: {
            company: companyWithRatingsData,
          },
        };
      })()
    );

    // Use Promise.all to wait for all promises to resolve
    const results = await Promise.all(promises);

    // Return the response
    return res.status(200).json(results[0]);
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

exports.companySuggestions = async (req, res) => {
  try {
    const keyword = req.query.keyword.toLowerCase();

    const companySuggestions = await Company.find({
      name: { $regex: keyword, $options: "i" },
    }).limit(5);
    // .select(["name", "slug"]);

    res.status(200).json({ suggestions: companySuggestions });
  } catch (error) {
    console.error("Error in company suggestions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
