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

jobSchema.methods.addRating = function (rating) {
  this.ratings.push(rating);
  this.updateAverageRatings();
};

jobSchema.methods.updateAverageRatings = function () {
  const totalRatings = this.ratings.length;

  // Update average for each parameter
  const ratingParameters = [
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

  ratingParameters.forEach((parameter) => {
    const sumParameterRating = this.ratings.reduce(
      (sum, rating) => sum + rating[parameter],
      0
    );

    // Handle case where there are no ratings for the parameter
    if (totalRatings === 0) {
      this.averageRatings[parameter] = 0;
    } else {
      this.averageRatings[parameter] = sumParameterRating / totalRatings;
    }
  });

  // Calculate average overall rating based on the averages of each parameter
  const sumOverallRating = ratingParameters.reduce(
    (sum, parameter) => sum + this.averageRatings[parameter],
    0
  );
  this.averageOverallRating =
    totalRatings === 0 ? 0 : sumOverallRating / ratingParameters.length;
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
