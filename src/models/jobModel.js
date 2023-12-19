const mongoose = require("mongoose");
const slugify = require("slugify");
const calculateOverallRating = require("../utils/calculateRating");

const jobSchema = new mongoose.Schema({
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
  slug: String,
});

jobSchema.methods.calculateOverallRating = function () {
  return calculateOverallRating(this.ratings);
};

jobSchema.index({ title: "text", description: "text" });

jobSchema.pre("save", function (next) {
  const removeSpecialChars = (str) => str.replace(/[*+~.()'"!:@]/g, "");
  this.slug = slugify(removeSpecialChars(this.title), { lower: true });
  next();
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
