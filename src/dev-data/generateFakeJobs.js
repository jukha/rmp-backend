const { faker } = require("@faker-js/faker");
const mongoose = require("mongoose");
const fs = require("fs");
const Company = require("../models/companyModel");
const dotenv = require("dotenv");

dotenv.config();

const dbURI = process.env.CLUSTER_DB_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(dbURI, { dbName }).then(() => {
  console.log("Successfully connected to database");
});

const numberOfJobsPerCompany = 5;

// Fetch existing companies from the database
async function getExistingCompanies() {
  try {
    const existingCompanies = await Company.find({});
    return existingCompanies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

// Generate dummy jobs assigned to the first company
async function generateDummyJobs() {
  try {
    const existingCompanies = await getExistingCompanies();

    if (existingCompanies.length < 1) {
      console.log("No companies found in the database.");
      return;
    }

    const firstCompany = existingCompanies[0];

    const dummyJobs = [];

    for (let i = 0; i < numberOfJobsPerCompany; i++) {
      dummyJobs.push({
        title: faker.person.jobTitle(),
        description: faker.lorem.sentence(),
        company: firstCompany._id,
      });
    }

    const jobsFilePath = `${__dirname}/dummyJobs.json`;
    fs.writeFileSync(jobsFilePath, JSON.stringify(dummyJobs, null, 2));
    console.log(
      `Dummy jobs data has been generated and saved to ${jobsFilePath}`
    );
  } catch (error) {
    console.error("Error generating dummy jobs:", error);
  }
  process.exit();
}

// Run the script
generateDummyJobs();
