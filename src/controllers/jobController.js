const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const SavedJob = require("../models/SavedJobModel");
const ratingsUtil = require("../utils/getRatingsByType");
const APIFeatures = require("../utils/apiFeatures");

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

    // Array to store promises
    const promises = [];

    // Fetch ratings using utility function
    promises.push(
      (async () => {
        const { success, data } = await ratingsUtil.getRatings("job", job._id);

        if (!success) {
          return res.status(404).json({ success: false, message: data });
        }

        const jobWithRatingsData = {
          ...job.toObject(),
          ratings: data.ratings,
          overallAvgRating: data.overallAvgRating,
          parametersAvgRatings: data.parametersAvgRatings,
        };

        return {
          success: true,
          data: {
            job: jobWithRatingsData,
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

    console.log("compnayId", companyId);

    const userId = req.params.userId;

    const company = await Company.findById(companyId);

    const companyName = company.name;

    // Fetch jobs for the company
    // const jobs = await Job.find({ company: companyId });

    const features = new APIFeatures(
      Job.find({ company: companyId }),
      req.query
    ).paginate();

    await features.getTotalRecords();

    const jobs = await features.query;

    const paginationInfo = features.getPaginationInfo();

    // if (!userId) {
    //   // If userId is not provided, return jobs without save status
    //   return res.status(200).json({
    //     success: true,
    //     data: jobs,
    //     pagination: paginationInfo,
    //     companyName,
    //   });
    // }

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

    // Array to store promises
    const jobPromises = [];

    for (const job of jobs) {
      // Add each promise to the array
      jobPromises.push(
        (async () => {
          const jobRatingSummary = await ratingsUtil.getJobRatingsSummary(
            job._id
          );

          return {
            ...job.toObject(),
            isSaved: savedJobMap[job._id.toString()] || false,
            overallAvgRating: jobRatingSummary.data.overallAvgRating,
            totalRatings: jobRatingSummary.data.totalRatings,
          };
        })()
      );
    }

    // Use Promise.all to wait for all promises to resolve
    const jobsWithSaveStatus = await Promise.all(jobPromises);

    // Return the response with the updated jobs and company name
    return res.status(200).json({
      success: true,
      data: jobsWithSaveStatus,
      pagination: paginationInfo,
      companyName,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
