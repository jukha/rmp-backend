const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Company = require("../models/companyModel");
const Job = require("../models/jobModel");

dotenv.config();

const DB = process.env.LOCAL_DB;

mongoose.connect(DB).then(() => {
  console.log("Successfully connected to database");
});

// READ JSON FILE
const companies = JSON.parse(fs.readFileSync(`${__dirname}/dummyCompanies.json`));
const jobs = JSON.parse(fs.readFileSync(`${__dirname}/dummyJobs.json`));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Company.create(companies);
    await Job.create(jobs);

    console.log("Data successfully loaded");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// DELTE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Company.deleteMany();
    await Job.deleteMany();
    console.log("Data successfully deleted");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
