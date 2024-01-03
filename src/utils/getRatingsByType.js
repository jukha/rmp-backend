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
    // let ratings;
    let features;

    // Get ratings for a specific job
    if (type === "job") {
      features = new APIFeatures(
        Rating.find({ jobId: id }).populate("user"),
        queryObj
      ).paginate();
      // ratings = await Rating.find({ jobId: id }).populate({
      //   path: "user",
      // });
    }

    // Get ratings for a specific company
    if (type === "company") {
      features = new APIFeatures(
        Rating.find({ companyId: id }).populate("user"),
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

    return {
      success: true,
      data: {
        ratings: {
          data: ratings,
          pagination,
        },
        overallAvgRating,
        parametersAvgRatings,
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
