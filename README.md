## Instructions for Inserting/Deleting Random Companies and Jobs

### Step 1: Generate Random Companies and Import into database

To add random <b>Companies</b> to the database, follow these steps:

1.Run the following script to generate random company data:

```bash
node src/dev-data/generateFakeCompanies.js
```

This script will generate a file named <mark>dummyCompanies</mark>.json containing random company data.

2.Insert the newly generated data into the <b>companies</b> collection using the following

```bash
node src/dev-data/import-dev-data.js --insert --companies
```

### Step 2: Generate Random Jobs and Import into database

To add random <b>Jobs</b> associated with the generated companies, proceed with the following steps:

1. Run the script to generate random job data:

```bash
node src/dev-data/generateFakeJobs.js
```

This script will generate a file named <mark>dummyJobs.json </mark> containing random job data assigned to the companies from dummyCompanies.json.

2. Insert the newly generated data into the <b>jobs</b> collection using the following script:

```bash
node src/dev-data/import-dev-data.js --insert --jobs
```

### Delete Data

To delete existing data from a collection, use the following scripts:

##### Delete Categories

To delete the data from the collections run this script:

```bash
node src/dev-data/import-dev-data.js --delete --categories
```

##### Delete Jobs

Run this script to delete data from the jobs collection:

```bash
node src/dev-data/import-dev-data.js --delete --jobs

```

##### Delete Saved Jobs

To delete the data from the collections run this script:

```bash
node src/dev-data/import-dev-data.js --delete --savedJobs
```
