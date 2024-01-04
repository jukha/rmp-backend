const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const SavedJob = require("../models/SavedJobModel");
const ratingsUtil = require("../utils/getRatingsByType");
const APIFeatures = require("../utils/apiFeatures");

exports.addJob = async (req, res) => {
  try {
    const { title, description, location, company } = req.body;
    const createdBy = req.user._id;

    // Check if required fields are present
    if (!title || !description || !location || !company) {
      return res.status(400).json({
        success: false,
        message: "Name, description, company and location are required fields",
      });
    }

    // Perform case-insensitive search for a job with the same title
    const existingJob = await Job.findOne({
      title: { $regex: new RegExp(title, "i") },
    });

    if (existingJob) {
      return res.status(400).json({
        success: false,
        message: "Job with a similar title already exists",
      });
    }

    const newJob = new Job({
      title: title,
      description: description,
      location: location,
      company: company,
      createdBy: createdBy,
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
        const { success, data } = await ratingsUtil.getRatings(
          "job",
          job._id,
          req.query
        );

        if (!success) {
          return res.status(404).json({ success: false, message: data });
        }

        const jobWithRatingsData = {
          ...job.toObject(),
          ratings: data.ratings,
          overallAvgRating: data.overallAvgRating,
          parametersAvgRatings: data.parametersAvgRatings,
          ratingDistribution: data.ratingDistribution,
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

    let features;

    if (!keyword) {
      features = new APIFeatures(
        Job.find().populate("company"),
        req.query
      ).paginate();
    } else {
      features = new APIFeatures(
        // Job.find({ $text: { $search: keyword } }).populate("company"),
        Job.find({
          title: { $regex: keyword, $options: "i" },
        }),
        req.query
      ).paginate();
    }

    await features.getTotalRecords();
    const jobs = await features.query;
    const paginationInfo = features.getPaginationInfo();

    console.log("jobs", jobs);

    const jobsWithRating = await Promise.all(
      jobs.map(async (job) => {
        const ratingSummary = await ratingsUtil.getRatingsSummary(
          "job",
          job._id
        );
        return {
          ...job.toObject(),
          ratingSummary,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: jobsWithRating,
      pagination: paginationInfo,
      message: "Jobs retrieved successfully against the query",
    });
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
          const jobRatingSummary = await ratingsUtil.getRatingsSummary(
            "job",
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

exports.getSimilarJobs = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const originalJob = await Job.findById(jobId);

    if (!originalJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    const similarJobCriteria = {
      company: originalJob.company,
      _id: { $ne: originalJob._id },
    };

    const similarJobs = await Job.find(similarJobCriteria).limit(3);

    const similarJobsPromises = [];

    for (const job of similarJobs) {
      similarJobsPromises.push(
        (async () => {
          const jobRatingSummary = await ratingsUtil.getRatingsSummary(
            "job",
            job._id
          );
          return {
            ...job.toObject(),
            overallAvgRating: jobRatingSummary.data.overallAvgRating,
          };
        })()
      );
    }

    const similarJobsWithOverallAvgRatings = await Promise.all(
      similarJobsPromises
    );

    res.json({ success: true, data: similarJobsWithOverallAvgRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
