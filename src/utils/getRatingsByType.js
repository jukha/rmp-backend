const Rating = require("../models/ratingModel");
const APIFeatures = require("./apiFeatures");

// exports.getRatings = async (type, id) => {
//   try {
//     let ratings;

//     // Get ratings for a specific job
//     if (type === "job") {
//       ratings = await Rating.find({ jobId: id }).populate({
//         path: "user",
//       });
//     }

//     // Get ratings for a specific company
//     if (type === "company") {
//       ratings = await Rating.find({ companyId: id }).populate({
//         path: "user",
//       });
//     }

//     if (!ratings || ratings.length === 0) {
//       // If no ratings are found, return default values
//       return {
//         success: true,
//         data: {
//           ratings: [],
//           overallAvgRating: 0,
//           parametersAvgRatings: {},
//         },
//       };
//     }

//     // Calculate on-the-fly averages
//     const totalRatings = ratings.length;

//     const overallAvgRating =
//       ratings.reduce((sum, rating) => sum + rating.ratingAverage, 0) /
//       totalRatings;

//     const parametersAvgRatings = {};
//     const ratingParameterKeys = Object.keys(ratings[0].parametersRating);

//     for (const parameter of ratingParameterKeys) {
//       const parameterSum = ratings.reduce(
//         (sum, rating) => sum + rating.parametersRating[parameter],
//         0
//       );
//       parametersAvgRatings[parameter] = Number(
//         (parameterSum / totalRatings).toFixed(1)
//       );
//     }

//     return {
//       success: true,
//       data: {
//         ratings,
//         overallAvgRating,
//         parametersAvgRatings,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching ratings:", error.message);
//     throw new Error("Internal Server Error");
//   }
// };

exports.getRatings = async (type, id, queryObj) => {
  try {
    const RATING_VALUE_DISTRIBUTION = [
      { name: "awful", value: 1, count: 0 },
      { name: "ok", value: 2, count: 0 },
      { name: "good", value: 3, count: 0 },
      { name: "great", value: 4, count: 0 },
      { name: "awesome", value: 5, count: 0 },
    ];
    // let ratings;
    let features;

    // Get ratings for a specific job
    if (type === "job") {
      features = new APIFeatures(
        Rating.find({ jobId: id }).populate("user").sort({ _id: -1 }),
        queryObj
      ).paginate();
      // ratings = await Rating.find({ jobId: id }).populate({
      //   path: "user",
      // });
    }

    // Get ratings for a specific company
    if (type === "company") {
      features = new APIFeatures(
        Rating.find({ companyId: id }).populate("user").sort({ _id: -1 }),
        queryObj
      ).paginate();
      // ratings = await Rating.find({ companyId: id }).populate({
      //   path: "user",
      // });
    }

    await features.getTotalRecords();
    const ratings = await features.query;
    const pagination = features.getPaginationInfo();

    console.log("pagination", pagination);

    if (!ratings || ratings.length === 0) {
      // If no ratings are found, return default values
      return {
        success: true,
        data: {
          ratings: [],
          overallAvgRating: 0,
          parametersAvgRatings: {},
          pagination,
          ratingDistribution: RATING_VALUE_DISTRIBUTION,
        },
      };
    }

    // Calculate on-the-fly averages
    const totalRatings = ratings.length;

    const overallAvgRating = Number(
      (
        ratings.reduce((sum, rating) => sum + rating.ratingAverage, 0) /
        totalRatings
      ).toFixed(1)
    );

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

    // Update the rating distribution based on ratingAverage
    ratings.forEach((rating) => {
      const { ratingAverage } = rating;

      if (ratingAverage >= 1 && ratingAverage <= 1.5) {
        RATING_VALUE_DISTRIBUTION[0].count++;
      } else if (ratingAverage > 1.5 && ratingAverage <= 2.5) {
        RATING_VALUE_DISTRIBUTION[1].count++;
      } else if (ratingAverage > 2.5 && ratingAverage <= 3.5) {
        RATING_VALUE_DISTRIBUTION[2].count++;
      } else if (ratingAverage > 3.5 && ratingAverage <= 4.5) {
        RATING_VALUE_DISTRIBUTION[3].count++;
      } else if (ratingAverage > 4.5 && ratingAverage <= 5) {
        RATING_VALUE_DISTRIBUTION[4].count++;
      }
    });

    return {
      success: true,
      data: {
        ratings: {
          data: ratings,
          pagination,
        },
        overallAvgRating,
        parametersAvgRatings,
        ratingDistribution: RATING_VALUE_DISTRIBUTION,
      },
    };
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    throw new Error("Internal Server Error");
  }
};

exports.getRatingsSummary = async (type, id) => {
  try {
    let ratings;

    if (type === "job") {
      ratings = await Rating.find({ jobId: id });
    }

    if (type === "company") {
      ratings = await Rating.find({ companyId: id });
    }

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
    console.error("Error fetching company ratings summary:", error.message);
    throw new Error("Internal Server Error");
  }
};
