const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const appRouter = require("./src/routes/index");
const cors = require("cors");


dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

let mongoURI = process.env.LOCAL_DB;

mongoose
  .connect(mongoURI)
  .then(() => console.log("DB connection is successful."))
  .catch((error) => console.error("Connection error", error.message));

app.use(morgan("dev"));
app.use(cors());
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.json({ extended: true, limit: "50mb" }));

app.use("/api/v1", appRouter);

app.listen(port, () => {
  console.log(`Server listening on port 🚀: ${port}`);
});
