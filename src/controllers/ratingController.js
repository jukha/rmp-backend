const Rating = require("../models/ratingModel");
const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const UserRatingAction = require("../models/userRatingActionModel");

const COMPANY_RATING_PARAMETERS = [
  "reputation",
  "companyCulture",
  "opportunitiesForAdvancement",
  "workLifeBalance",
  "employeeBenefits",
  "leadershipAndManagement",
  "innovationAndTechnologyAdoption",
  "diversityAndInclusion",
  "corporateSocialResponsibility",
  "financialStability",
];
const JOB_RATING_PARAMETERS = [
  "compensation",
  "workLifeBalance",
  "jobSecurity",
  "opportunitiesForGrowth",
  "companyCulture",
  "jobSatisfaction",
  "workload",
  "benefits",
  "flexibility",
];

exports.addRating = async (req, res) => {
  const { companyId, jobId, parametersRating, ratingText } = req.body;
  const userId = req.user._id;

  try {
    // If both companyId and jobId are provided, it's a bad request
    if (companyId && jobId) {
      return res
        .status(400)
        .json({ error: "Provide either companyId or jobId, not both" });
    }

    // Check if a rating already exists for the user and the specified company or job
    let existingRating;

    if (jobId) {
      existingRating = await Rating.findOne({ userId, jobId });
    } else if (companyId) {
      existingRating = await Rating.findOne({ userId, companyId });
    }

    if (existingRating) {
      // If a rating already exists, update it instead of creating a new one
      existingRating.parametersRating = parametersRating;
      existingRating.ratingText = ratingText;
      const updatedRating = await existingRating.save();

      return res.status(200).json({
        success: true,
        data: updatedRating,
        message: "Rating updated successfully",
      });
    }

    // If no existing rating, create a new one after checking the parameters structure
    const isCompanyRating = companyId !== undefined;
    const expectedParameters = isCompanyRating
      ? COMPANY_RATING_PARAMETERS
      : JOB_RATING_PARAMETERS;

    const isValidParameters = expectedParameters.every(
      (param) => param in parametersRating
    );

    if (!isValidParameters) {
      return res
        .status(400)
        .json({ error: "Invalid parameters structure for the rating" });
    }

    const newRating = new Rating({
      userId,
      companyId: companyId || null,
      jobId: jobId || null,
      parametersRating,
      ratingText: ratingText,
    });

    const savedRating = await newRating.save();

    return res.status(201).json({
      success: true,
      data: savedRating,
      message: "Rating added successfully",
    });
  } catch (error) {
    console.error("Error adding/updating rating:", error.message);
    if (error.name === "ValidationError") {
      return res.status(500).json({ success: false, error: error.message });
    }
    console.log("outside");
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
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

    // Get reviews for a specific job
    if (jobId) {
      const existingJob = await Job.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      reviews = await Rating.find({ jobId }).populate({
        path: "user",
      });
    }

    // Get reviews for a specific company
    if (companyId) {
      const existingCompany = await Company.findById(companyId);
      if (!existingCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      reviews = await Rating.find({ companyId }).populate({
        path: "user",
      });
    }

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Calculate on-the-fly averages
    const totalReviews = reviews.length;

    const overallAvgRating =
      reviews.reduce((sum, review) => sum + review.ratingAverage, 0) /
      totalReviews;

    const parametersAvgRatings = {};
    const ratingParameterKeys = Object.keys(reviews[0].parametersRating);

    for (const parameter of ratingParameterKeys) {
      const parameterSum = reviews.reduce(
        (sum, review) => sum + review.parametersRating[parameter],
        0
      );
      parametersAvgRatings[parameter] = parameterSum / totalReviews;
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        overallAvgRating,
        parametersAvgRatings,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.reportARating = async (req, res) => {
  const { ratingId, isReported, reportingReason } = req.body;

  const userId = req.user._id;

  if (!ratingId || !isReported || !reportingReason) {
    return res.status(400).json({
      error: "ratingId, isReported, and reportingReason are required fields",
    });
  }

  try {
    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    // Check if the user is the owner of the rating
    if (rating.userId.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Cannot interact with your own rating.",
      });
    }

    if (isReported && !rating.isReported) {
      rating.isReported = true;

      rating.reportingReason = reportingReason;

      rating.reportedBy = userId;

      await rating.save();

      return res.status(200).json({
        success: true,
        message: "Rating flagged successfully!",
      });
    } else if (isReported && rating.isReported) {
      return res.status(400).json({
        success: false,
        message: "Someone has already flagged this and it is under review.",
      });
    }
  } catch (error) {
    console.error("Error Reporting rating:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateRatingFeedback = async (req, res) => {
  const { ratingId, feedbackType } = req.body;
  const userId = req.user._id;

  try {
    // Validate if feedbackType is valid
    if (feedbackType && !["thumbsUp", "thumbsDown"].includes(feedbackType)) {
      return res.status(400).json({ error: "Invalid feedbackType" });
    }

    // Find the rating by ID
    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    // Check if the user is the owner of the rating
    if (rating.userId.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Cannot interact with your own rating.",
      });
    }

    let userRatingAction = await UserRatingAction.findOne({
      userId,
      ratingId,
    });

    // If UserRatingAction doesn't exist
    if (!userRatingAction) {
      userRatingAction = new UserRatingAction({
        userId,
        ratingId,
        actionType: feedbackType || null, // Initialize actionType consistently
      });

      if (feedbackType) {
        // Check if the user is changing the action from thumbsUp to thumbsDown or vice versa
        const oppositeFeedbackType =
          feedbackType === "thumbsUp" ? "thumbsDown" : "thumbsUp";
        if (userRatingAction[oppositeFeedbackType]) {
          // The user is changing from thumbsUp to thumbsDown or vice versa
          rating[oppositeFeedbackType] -= 1;
        } else {
          // Update the corresponding action type in the UserRatingAction model
          // Update the count of that specific action type in the corresponding rating
          rating[feedbackType] += 1;
        }
      }

      // Save the updated models
      await userRatingAction.save();
      const updatedRating = await rating.save();

      return res.status(200).json({
        success: true,
        data: updatedRating,
        message: `${feedbackType} updated successfully`,
      });
    } else {
      // If UserRatingAction exists, check if the user has already performed a different action
      if (feedbackType && userRatingAction.actionType !== feedbackType) {
        // Check if the user is changing the action from thumbsUp to thumbsDown or vice versa
        const oppositeFeedbackType =
          feedbackType === "thumbsUp" ? "thumbsDown" : "thumbsUp";
        if (userRatingAction[oppositeFeedbackType]) {
          // The user is changing from thumbsUp to thumbsDown or vice versa
          rating[oppositeFeedbackType] -= 1;
          rating[feedbackType] += 1;
        } else {
          // Update the counts accordingly
          rating[userRatingAction.actionType] -= 1;
          rating[feedbackType] += 1;
          // Update UserRatingAction with the new action type
          userRatingAction.actionType = feedbackType;
        }
        await userRatingAction.save();
        const updatedRating = await rating.save();
        return res.status(200).json({
          success: true,
          data: updatedRating,
          message: "Updated successfully",
        });
      } else {
        // If UserRatingAction exists and the user performs the same action, return an error
        return res.status(400).json({
          success: false,
          message: `You have already ${feedbackType} this rating.`,
        });
      }
    }
  } catch (error) {
    console.error("Error updating rating feedback:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getRating = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id);

    const rating = await Rating.findById(id)
      .populate("company")
      .populate("job");

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found!",
      });
    }

    return res.status(200).json({
      success: true,
      data: rating,
    });
  } catch (error) {
    console.error("Error getting rating:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
