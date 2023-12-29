const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const SavedJob = require("../models/SavedJobModel");

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

    const job = await Job.findOne({ slug: jobSlug })
      .populate({
        path: "companyDetails",
        select: "-__v",
      })
      .populate({
        path: "ratings.user",
        select: "firstName lastName",
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
    }).limit(5);
    // .select(["title", "slug"]);

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

exports.getJobsByCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const userId = req.params.userId; // Assuming userId is passed as a route parameter

    const company = await Company.findById(companyId);

    const companyName = company ? company.name : null;

    // Fetch jobs for the company
    const jobs = await Job.find({ company: companyId });

    if (!userId) {
      // If userId is not provided, return jobs without save status
      return res.status(200).json({ success: true, data: jobs, companyName });
    }

    // Fetch saved jobs for the user
    const savedJobs = await SavedJob.find({
      user: userId,
      job: { $in: jobs.map((job) => job._id) },
    });

    // Create a map to efficiently check if a job is saved by the user
    const savedJobMap = {};
    savedJobs.forEach((savedJob) => {
      savedJobMap[savedJob.job.toString()] = true;
    });

    // Add a new property 'isSaved' to each job indicating whether it is saved by the user
    const jobsWithSaveStatus = jobs.map((job) => ({
      ...job.toObject(),
      isSaved: savedJobMap[job._id.toString()] || false,
    }));

    // Return the response with the updated jobs and company name
    return res.status(200).json({
      success: true,
      data: jobsWithSaveStatus,
      companyName,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
