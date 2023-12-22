const Job = require("../models/jobModel");

exports.addJob = async (req, res) => {
  try {
    const { title, description, location, company } = req.body;

    const newJob = new Job({
      title: title,
      description: description,
      location: location,
      company: company,
      ratings: [],
    });

    const savedJob = await newJob.save();

    return res.status(201).json({
      success: true,
      data: savedJob,
      message: "Job added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getJobBySlug = async (req, res) => {
  try {
    const jobSlug = req.params.jobSlug;

    const job = await Job.findOne({ slug: jobSlug }).populate({
      path: "companyDetails",
      select: "-__v",
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        job,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.jobSuggestions = async (req, res) => {
  try {
    const keyword = req.query.keyword.toLowerCase();

    const jobSuggestions = await Job.find({
      title: { $regex: keyword, $options: "i" },
    })
      .limit(5)
      .select(["title", "slug"]);

    res.status(200).json({ suggestions: jobSuggestions });
  } catch (error) {
    console.error("Error in job suggestions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.searchJobs = async (req, res) => {
  try {
    const keyword = req.query.q;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required for searching jobs",
      });
    }

    const jobs = await Job.find({ $text: { $search: keyword } });

    return res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addJobRating = async (req, res) => {
  try {
    const jobSlug = req.params.jobSlug;

    const {
      compensation,
      workLifeBalance,
      jobSecurity,
      opportunitiesForGrowth,
      companyCulture,
      jobSatisfaction,
      workload,
      benefits,
      flexibility,
      ratingText,
    } = req.body;

    // Use req.user to get the user information from the decoded token
    const { _id: userId } = req.user;

    const job = await Job.findOne({ slug: jobSlug });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const newRating = {
      compensation,
      workLifeBalance,
      jobSecurity,
      opportunitiesForGrowth,
      companyCulture,
      jobSatisfaction,
      workload,
      benefits,
      flexibility,
    };

    job.addRating(newRating, userId, ratingText);

    await job.save();

    return res.status(201).json({
      success: true,
      data: job,
      message: "Job rating added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
