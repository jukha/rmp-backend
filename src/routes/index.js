const express = require("express");
const userRouter = require("../routes/userRoutes");

const router = express.Router();

router.use("/users", userRouter);

module.exports = router;
