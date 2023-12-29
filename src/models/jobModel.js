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

    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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
