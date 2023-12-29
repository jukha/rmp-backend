const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ratingText: String,
    parametersRating: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ratingAverage: { type: Number, default: 0 },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

ratingSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

ratingSchema.virtual("job", {
  ref: "Job",
  localField: "jobId",
  foreignField: "_id",
  justOne: true,
});

ratingSchema.virtual("company", {
  ref: "Company",
  localField: "companyId",
  foreignField: "_id",
  justOne: true,
});

ratingSchema.pre("save", async function (next) {
  // Calculate the average for each rating parameter
  const ratingParameterKeys = Object.keys(this.parametersRating);
  const totalRatingParameters = ratingParameterKeys.length;

  this.ratingAverage =
    totalRatingParameters === 0
      ? 0
      : Number(
          (
            ratingParameterKeys.reduce(
              (sum, parameter) => sum + this.parametersRating[parameter],
              0
            ) / totalRatingParameters
          ).toFixed(1)
        );

  next();
});

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
