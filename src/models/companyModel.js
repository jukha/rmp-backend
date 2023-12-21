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
    // ... (unchanged)
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

companySchema.index({ name: "text", description: "text" });

companySchema.methods.addRating = function (rating) {
  this.ratings.push(rating);
  this.updateAverageRatings();
};

companySchema.methods.updateAverageRatings = function () {
  const totalRatings = this.ratings.length;

  // Update average for each parameter
  const ratingParameters = [
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

companySchema.pre("save", function (next) {
  const removeSpecialChars = (str) => str.replace(/[*+~.()'"!:@]/g, "");
  this.slug = slugify(removeSpecialChars(this.name), { lower: true });
  this.updateAverageRatings(); // Recalculate averages before saving
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
