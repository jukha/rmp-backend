const { faker } = require("@faker-js/faker");
const fs = require("fs");

const numberOfCompanies = 10;

const dummyCompanies = Array.from(
  { length: numberOfCompanies },
  (_, index) => ({
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    location: faker.location.streetAddress({ useFullAddress: true }),
  })
);

const filePath = `${__dirname}/dummyCompanies.json`;
fs.writeFileSync(filePath, JSON.stringify(dummyCompanies, null, 2));
console.log(`Dummy compnies data has been generated and saved to ${filePath}`);
