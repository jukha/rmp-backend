# Project Development Data Management

## Instructions for Adding Random Companies and Jobs

### Step 1: Add Random Companies

To add random companies to the database, run the following script:

```bash
node src/dev-data/generateFakeCompanies
```

This script will generate a file named dummyCompanies.json containing random company data.

### Step 2: Add Random Jobs

Next, run the script to add random jobs associated with the generated companies:

```bash
node src/dev-data/generateFakeJobs
```

This script will generate a file named dummyJobs.json containing random job data assigned to the companies from dummyCompanies.json.

### Step 3: Import or Delete Data

Run the following script to either import the generated data into the database or delete the existing data:

##### Import Data

```bash
node src/dev-data/import-dev-data --import
```

This command will store the generated jobs and companies data into the respective collections in the database.

##### Delete Data

```bash
node src/dev-data/import-dev-data --delete
```

This command will delete data from both the jobs and companies collections in the database.
