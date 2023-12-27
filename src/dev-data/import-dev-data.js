const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Company = require("../models/companyModel");
const Job = require("../models/jobModel");
const SavedJob = require("../models/SavedJobModel");

dotenv.config();

const dbURI = process.env.CLUSTER_DB_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(dbURI, { dbName }).then(() => {
  console.log("Successfully connected to the database");
});

// READ JSON FILES
const companies = JSON.parse(
  fs.readFileSync(`${__dirname}/dummyCompanies.json`)
);
const jobs = JSON.parse(fs.readFileSync(`${__dirname}/dummyJobs.json`));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // Check for additional arguments to determine which collection to import
    if (process.argv.includes("--companies")) {
      await Company.create(companies);
      console.log("Companies data successfully loaded");
    } else if (process.argv.includes("--jobs")) {
      await Job.create(jobs);
      console.log("Jobs data successfully loaded");
    } else {
      console.log(
        "Please specify which collection to import (--companies or --jobs)"
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
};

// DELETE DATA FROM DB
const deleteData = async () => {
  try {
    // Check for additional arguments to determine which collection to delete
    if (process.argv.includes("--companies")) {
      await Company.deleteMany();
      console.log("Companies data successfully deleted");
    } else if (process.argv.includes("--jobs")) {
      await Job.deleteMany();
      console.log("Jobs data successfully deleted");
    } else if (process.argv.includes("--savedJobs")) {
      await SavedJob.deleteMany();
      console.log("Saved Jobs data successfully deleted");
    } else {
      console.log(
        "Please specify which collection to delete (--companies, --jobs or --savedJobs)"
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
};

// Determine if it's an import or delete operation
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log(
    "Invalid command. Use --import or --delete flag to perform operations."
  );
  process.exit();
}
