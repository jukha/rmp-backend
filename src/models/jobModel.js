const mongoose = require("mongoose");
const slugify = require("slugify");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        text: {
          type: String,
        },
        average: {
          type: Number,
          default: 0,
        },
        data: {
          compensation: {
            type: Number,
            required: true,
          },
          workLifeBalance: {
            type: Number,
            required: true,
          },
          jobSecurity: {
            type: Number,
            required: true,
          },
          opportunitiesForGrowth: {
            type: Number,
            required: true,
          },
          companyCulture: {
            type: Number,
            required: true,
          },
          jobSatisfaction: {
            type: Number,
            required: true,
          },
          workload: {
            type: Number,
            required: true,
          },
          benefits: {
            type: Number,
            required: true,
          },
          flexibility: {
            type: Number,
            required: true,
          },
        },
      },
    ],
    averageRatings: {
      compensation: {
        type: Number,
        default: 0,
      },
      workLifeBalance: {
        type: Number,
        default: 0,
      },
      jobSecurity: {
        type: Number,
        default: 0,
      },
      opportunitiesForGrowth: {
        type: Number,
        default: 0,
      },
      companyCulture: {
        type: Number,
        default: 0,
      },
      jobSatisfaction: {
        type: Number,
        default: 0,
      },
      workload: {
        type: Number,
        default: 0,
      },
      benefits: {
        type: Number,
        default: 0,
      },
      flexibility: {
        type: Number,
        default: 0,
      },
    },
    averageOverallRating: { type: Number, default: 0 },
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

jobSchema.methods.updateAverageRatings = function () {
  const totalRatings = this.ratings.length;

  // Calculate average for each parameter
  this.ratings.forEach((rating) => {
    const data = rating.data;
    const ratingParameterKeys = Object.keys(data);

    ratingParameterKeys.forEach((parameter) => {
      this.averageRatings[parameter] =
        (this.averageRatings[parameter] * (totalRatings - 1) +
          data[parameter]) /
        totalRatings;
    });
  });

  // Calculate overall rating based on the averages of each parameter
  this.averageOverallRating = this.calculateOverallRating(this.averageRatings);

  this.markModified("averageRatings"); // Mark the field as modified to ensure it gets saved
  this.markModified("averageOverallRating"); // Mark overall rating as modified
};

jobSchema.methods.calculateOverallRating = function (data) {
  const ratingParameterKeys = Object.keys(data);

  const sumOverallRating = ratingParameterKeys.reduce(
    (sum, parameter) => sum + data[parameter],
    0
  );

  return ratingParameterKeys.length === 0
    ? 0
    : Number((sumOverallRating / ratingParameterKeys.length).toFixed(2));
};

jobSchema.methods.addRating = function (rating, userId, ratingText) {
  // Calcuate the average of the document instance
  const ratingValues = Object.values(rating);
  const totalValues = ratingValues.length;
  const sum = ratingValues.reduce((acc, value) => acc + value, 0);
  const averageOfDocument = Number(
    (totalValues === 0 ? 0 : sum / totalValues).toFixed(2)
  );
  this.ratings.push({
    user: userId,
    text: ratingText,
    average: averageOfDocument,
    data: rating,
  });

  // Update the average ratings for the job
  this.updateAverageRatings();

  // Calculate the average of each individual rating
  this.calculateIndividualRatingAverages();

  // Mark modified fields to ensure they get saved
  this.markModified("averageRatings");
  this.markModified("ratings");
  this.markModified("averageOverallRating");
};

jobSchema.methods.calculateIndividualRatingAverages = function () {
  // Iterate through each parameter
  const ratingParameterKeys = Object.keys(this.averageRatings);

  ratingParameterKeys.forEach((parameter) => {
    // Calculate the average for the parameter based on individual ratings
    const sumParameter = this.ratings.reduce(
      (sum, rating) => sum + rating.data[parameter],
      0
    );

    this.averageRatings[parameter] =
      this.ratings.length === 0 ? 0 : sumParameter / this.ratings.length;
  });
};

jobSchema.index({ title: "text", description: "text" });

jobSchema.virtual("companyDetails", {
  type: "ObjectId",
  ref: "Company",
  localField: "company",
  foreignField: "_id",
  justOne: true,
});

jobSchema.pre("save", function (next) {
  const removeSpecialChars = (str) => str.replace(/[*+~.()'"!:@]/g, "");
  this.slug = slugify(removeSpecialChars(this.title), { lower: true });
  next();
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
