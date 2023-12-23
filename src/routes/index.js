const express = require("express");
const userRouter = require("../routes/userRoutes");
const companyRouter = require("../routes/companyRoutes");
const jobRouter = require("../routes/jobRoutes");
const savedJobRouter = require("../routes/savedJobRoutes");

const router = express.Router();

router.use("/users", userRouter);
router.use("/companies", companyRouter);
router.use("/jobs", jobRouter);
router.use("/saved-jobs", savedJobRouter);

module.exports = router;
