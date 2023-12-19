const Job = require("../models/jobModel");

exports.addJob = async (req, res) => {
  try {
    const { title, description, location } = req.body;

    const newJob = new Job({
      title: title,
      description: description,
      location: location,
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

    const job = await Job.findOne({ slug: jobSlug });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const overallRating = job.calculateOverallRating();

    return res.status(200).json({
      success: true,
      data: {
        job: job,
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
