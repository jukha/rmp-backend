const SavedJob = require("../models/SavedJobModel");
const APIFeatures = require("../utils/apiFeatures");
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

    const features = new APIFeatures(
      SavedJob.find({ user: userId }).populate("job"),
      req.query
    ).paginate();

    await features.getTotalRecords();
    const savedJobs = await features.query;
    const paginationInfo = features.getPaginationInfo();

    const savedJobsWithSummary = await Promise.all(
      savedJobs.map(async (savedJob) => {
        const ratingSummary = await jobSummaryUtil.getRatingsSummary(
          "job",
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
      pagination: paginationInfo,
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
