const express = require("express");
const userRouter = require("../routes/userRoutes");

const router = express.Router();

router.use("/user", userRouter);

module.exports = router;
