const Rating = require("../models/ratingModel");

exports.getRatings = async (type, id) => {
  try {
    let ratings;

    // Get ratings for a specific job
    if (type === "job") {
      ratings = await Rating.find({ jobId: id }).populate({
        path: "user",
      });
    }

    // Get ratings for a specific company
    if (type === "company") {
      ratings = await Rating.find({ companyId: id }).populate({
        path: "user",
      });
    }

    if (!ratings || ratings.length === 0) {
      // If no ratings are found, return default values
      return {
        success: true,
        data: {
          ratings: [],
          overallAvgRating: 0,
          parametersAvgRatings: {},
        },
      };
    }

    // Calculate on-the-fly averages
    const totalRatings = ratings.length;

    const overallAvgRating =
      ratings.reduce((sum, rating) => sum + rating.ratingAverage, 0) /
      totalRatings;

    const parametersAvgRatings = {};
    const ratingParameterKeys = Object.keys(ratings[0].parametersRating);

    for (const parameter of ratingParameterKeys) {
      const parameterSum = ratings.reduce(
        (sum, rating) => sum + rating.parametersRating[parameter],
        0
      );
      parametersAvgRatings[parameter] = Number(
        (parameterSum / totalRatings).toFixed(1)
      );
    }

    return {
      success: true,
      data: {
        ratings,
        overallAvgRating,
        parametersAvgRatings,
      },
    };
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    throw new Error("Internal Server Error");
  }
};

exports.getJobRatingsSummary = async (jobId) => {
  try {
    const ratings = await Rating.find({ jobId });

    if (!ratings || ratings.length === 0) {
      return {
        success: true,
        data: {
          overallAvgRating: 0,
          totalRatings: 0,
        },
      };
    }

    const totalRatings = ratings.length;
    const overallAvgRating = Number(
      (
        ratings.reduce((sum, review) => sum + review.ratingAverage, 0) /
        totalRatings
      ).toFixed(1)
    );

    return {
      success: true,
      data: {
        overallAvgRating,
        totalRatings,
      },
    };
  } catch (error) {
    console.error("Error fetching job ratings summary:", error.message);
    throw new Error("Internal Server Error");
  }
};
