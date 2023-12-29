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
  slug: String,
});

companySchema.index({ name: "text", description: "text" });

companySchema.pre("save", function (next) {
  const removeSpecialChars = (str) => str.replace(/[*+~.()'"!:@]/g, "");
  this.slug = slugify(removeSpecialChars(this.name), { lower: true });
  this.updateAverageRatings(); // Recalculate averages before saving
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
