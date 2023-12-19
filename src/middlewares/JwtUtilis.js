const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/userModel"); // Import your User model

const { promisify } = require("util");

dotenv.config();

exports.generateAuthToken = async (user) => {
  const payload = { _id: user._id, email: user.email };
  return jwt.sign({ payload }, process.env.TOP_SECRET, { expiresIn: 18000 });
};

exports.verifyAuthToken = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send({ message: "Token not found" });
  } else {
    const tokenBody = token.slice(7);
    try {
      const decoded = await promisify(jwt.verify)(
        tokenBody,
        process.env.TOP_SECRET
      );

      // Check if the user with the extracted ID exists in the system
      const userId = decoded.payload._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send({
          status: 404,
          message: "User not found in the system",
        });
      }

      // Set the user object in the request for further use
      req.user = user;
      next();
    } catch (err) {
      return res
        .status(401)
        .send({ status: 401, message: "Expired token, access denied" });
    }
  }
};
