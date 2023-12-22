const mongoose = require("mongoose");
const slugify = require("slugify");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
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
        reputation: {
          type: Number,
          required: true,
        },
        companyCulture: {
          type: Number,
          required: true,
        },
        opportunitiesForAdvancement: {
          type: Number,
          required: true,
        },
        workLifeBalance: {
          type: Number,
          required: true,
        },
        employeeBenefits: {
          type: Number,
          required: true,
        },
        leadershipAndManagement: {
          type: Number,
          required: true,
        },
        innovationAndTechnologyAdoption: {
          type: Number,
          required: true,
        },
        diversityAndInclusion: {
          type: Number,
          required: true,
        },
        corporateSocialResponsibility: {
          type: Number,
          required: true,
        },
        financialStability: {
          type: Number,
          required: true,
        },
      },
    },
  ],
  averageRatings: {
    reputation: { type: Number, default: 0 },
    companyCulture: { type: Number, default: 0 },
    opportunitiesForAdvancement: { type: Number, default: 0 },
    workLifeBalance: { type: Number, default: 0 },
    employeeBenefits: { type: Number, default: 0 },
    leadershipAndManagement: { type: Number, default: 0 },
    innovationAndTechnologyAdoption: { type: Number, default: 0 },
    diversityAndInclusion: { type: Number, default: 0 },
    corporateSocialResponsibility: { type: Number, default: 0 },
    financialStability: { type: Number, default: 0 },
  },
  averageOverallRating: { type: Number, default: 0 },
  slug: String,
});

companySchema.methods.updateAverageRatings = function () {
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

companySchema.methods.calculateOverallRating = function (data) {
  const ratingParameterKeys = Object.keys(data);

  const sumOverallRating = ratingParameterKeys.reduce(
    (sum, parameter) => sum + data[parameter],
    0
  );

  return ratingParameterKeys.length === 0
    ? 0
    : Number((sumOverallRating / ratingParameterKeys.length).toFixed(2));
};

companySchema.methods.addRating = function (rating, userId, ratingText) {
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

companySchema.methods.calculateIndividualRatingAverages = function () {
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

companySchema.index({ name: "text", description: "text" });

companySchema.pre("save", function (next) {
  const removeSpecialChars = (str) => str.replace(/[*+~.()'"!:@]/g, "");
  this.slug = slugify(removeSpecialChars(this.name), { lower: true });
  this.updateAverageRatings(); // Recalculate averages before saving
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
