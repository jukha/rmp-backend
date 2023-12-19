const passport = require("passport");

const {
  hashPassword,
  comparePassword,
} = require("../middlewares/EncryptionUtilis");
const jwtUtility = require("../middlewares/JwtUtilis");
const User = require("../models/userModel");

exports.signup = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      if (!req.body.password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for email/password signups",
        });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const userCreated = await User.create({
        ...req.body,
        password: hashedPassword,
      });

      userCreated.password = "";
      const token = await jwtUtility.generateAuthToken(userCreated);

      if (userCreated) {
        return res.status(200).send({
          success: true,
          message: `Account created with ${req.body.email} successfully`,
          data: { user: userCreated, token },
        });
      }

      return res.status(400).json({
        success: false,
        message: "Something went wrong. Please try again later",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Email already exists. Please try another one",
    });
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(503).json({
      success: false,
      message: "Internal Server Error. ",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const isPasswordCorrect = await comparePassword(
        req.body.password,
        user.password
      );

      if (isPasswordCorrect) {
        const token = await jwtUtility.generateAuthToken(user);
        return res.status(200).send({
          success: true,
          message: "Logged in successfully",
          data: { user: user, token: token },
        });
      }

      return res
        .status(400)
        .send({ success: false, message: "Incorrect password" });
    }

    return res.status(400).send({ success: false, message: "Incorrect email" });
  } catch (error) {
    console.error("Error in login controller:", error);

    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error." });
  }
};

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile"],
});

exports.googleCallback = async (req, res, next) => {
  passport.authenticate("google", async (err, user) => {
    try {
      if (err) {
        console.error("Error in Google Callback:", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }

      // The user profile is available in req.user
      const { id, displayName, emails } = user;

      const existingUser = await User.findOne({ googleId: id });

      if (existingUser) {
        const token = await jwtUtility.generateAuthToken(existingUser);
        return res.status(200).json({
          success: true,
          message: "Logged in successfully with Google",
          data: { user: existingUser, token: token },
        });
      }

      // If the user doesn't exist, create a new user in the database
      const newUser = await User.create({
        firstName: displayName.split(" ")[0],
        lastName: displayName.split(" ").slice(1).join(" "),
        email: emails[0].value,
        googleId: id,
      });

      const token = await jwtUtility.generateAuthToken(newUser);

      return res.status(200).json({
        success: true,
        message: "Account created and logged in successfully with Google",
        data: { user: newUser, token: token },
      });
    } catch (error) {
      console.error("Error in Google Callback:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  })(req, res, next);
};
