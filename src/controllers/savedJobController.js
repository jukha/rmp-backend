const SavedJob = require("../models/SavedJobModel");
const jobSummaryUtil = require("../utils/getRatingsByType");

exports.saveJob = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.jobId;

    const existingSavedJob = await SavedJob.findOne({
      user: userId,
      job: jobId,
    });

    if (existingSavedJob) {
      await existingSavedJob.deleteOne();
      return res
        .status(200)
        .json({ success: true, message: "Job unsaved successfully" });
    } else {
      const newSavedJob = new SavedJob({ user: userId, job: jobId });
      await newSavedJob.save();
      return res
        .status(200)
        .json({ success: true, message: "Job saved successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getSavedJobsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const savedJobs = await SavedJob.find({ user: userId }).populate("job");

    // Use Promise.all to parallelize the execution of getJobRatingsSummary
    const savedJobsWithSummary = await Promise.all(
      savedJobs.map(async (savedJob) => {
        const ratingSummary = await jobSummaryUtil.getJobRatingsSummary(
          savedJob.job._id
        );
        return {
          ...savedJob.toObject(),
          ratingSummary,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: savedJobsWithSummary,
      message: "Saved jobs retrieved successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

