const Company = require("../models/companyModel");
const APIFeatures = require("../utils/apiFeatures");
const ratingsUtil = require("../utils/getRatingsByType");
const companySummaryUtil = require("../utils/getRatingsByType");

exports.addCompany = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const createdBy = req.user._id;

    // Check if required fields are present
    if (!name || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and location are required fields",
      });
    }

    // Perform case-insensitive search for a company with the same name
    const existingCompany = await Company.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with a similar name already exists",
      });
    }

    const newCompany = new Company({
      name: name,
      description: description,
      location: location,
      createdBy: createdBy,
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
          company._id,
          req.query
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

    let features;

    if (!keyword) {
      features = new APIFeatures(Company.find(), req.query).paginate();
    } else {
      features = new APIFeatures(
        // Company.find({ $text: { $search: keyword } }),
        Company.find({
          name: { $regex: keyword, $options: "i" },
        }),
        req.query
      ).paginate();
    }

    await features.getTotalRecords();
    const companies = await features.query;
    const paginationInfo = features.getPaginationInfo();

    const companiesWithRating = await Promise.all(
      companies.map(async (company) => {
        const ratingSummary = await ratingsUtil.getRatingsSummary(
          "company",
          company._id
        );
        return {
          ...company.toObject(),
          ratingSummary,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: companiesWithRating,
      pagination: paginationInfo,
      message: "Companies retrieved successfully against the query",
    });
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
