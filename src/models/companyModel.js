const mongoose = require("mongoose");
const slugify = require("slugify");
const calculateOverallRating = require("../utils/calculateRating");

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
  ],
  slug: String,
});

companySchema.index({ name: "text", description: "text" });

companySchema.methods.calculateOverallRating = function () {
  return calculateOverallRating(this.ratings);
};

companySchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
