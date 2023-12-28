const Rating = require("../models/ratingModel");
const Job = require("../models/jobModel");
const Company = require("../models/companyModel");

exports.addRating = async (req, res) => {
  const { companyId, jobId, parametersRating, textContent } = req.body;

  try {
    // If both companyId and jobId are provided, it's a bad request
    if (companyId && jobId) {
      return res
        .status(400)
        .json({ error: "Provide either companyId or jobId, not both" });
    }

    // Validate that ratings for each parameter are not greater than 5
    const invalidRatings = Object.values(parametersRating).some(
      (rating) => rating > 5
    );

    if (invalidRatings) {
      return res
        .status(400)
        .json({ error: "Ratings for each parameter must be 5 or less" });
    }

    // Check if the job exists (if jobId is provided)
    if (jobId) {
      const existingJob = await Job.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }
    }

    // Check if the company exists (if companyId is provided)
    if (companyId) {
      const existingCompany = await Company.findById(companyId);
      if (!existingCompany) {
        return res.status(404).json({ error: "Company not found" });
      }
    }

    // Create a new Rating instance
    const newRating = new Rating({
      userId: req.user._id,
      companyId: companyId || null,
      jobId: jobId || null,
      parametersRating,
      textContent,
    });

    const savedRating = await newRating.save();

    return res.status(201).json({
      success: true,
      data: savedRating,
      message: "Rating added successfully",
    });
  } catch (error) {
    console.error("Error adding rating:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getRatings = async (req, res) => {
  const { companyId, jobId } = req.query;

  try {
    // If both companyId and jobId are provided, it's a bad request
    if (companyId && jobId) {
      return res
        .status(400)
        .json({ error: "Provide either companyId or jobId, not both" });
    }

    let reviews;

    // Get reviews for a specific job (if jobId is provided)
    if (jobId) {
      const existingJob = await Job.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      reviews = await Rating.find({ jobId });
    }

    // Get reviews for a specific company (if companyId is provided)
    if (companyId) {
      const existingCompany = await Company.findById(companyId);
      if (!existingCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      reviews = await Rating.find({ companyId });
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
