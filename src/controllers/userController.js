const axios = require("axios");
const {
  hashPassword,
  comparePassword,
} = require("../middlewares/EncryptionUtilis");
const jwtUtility = require("../middlewares/JwtUtilis");
const User = require("../models/userModel");
const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const Rating = require("../models/ratingModel");
const APIFeatures = require("../utils/apiFeatures");

exports.signup = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      if (!req.body.password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for email/password signups",
        });
      }

      if (req.body.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least eight characters long",
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
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    if (user) {
      if (user.googleId) {
        return res.status(400).send({
          success: false,
          message:
            "This email is registered using Google. Please login with Google.",
        });
      }
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

exports.googleAuth = async (req, res, next) => {
  try {
    const { googleAccessToken } = req.body;
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      }
    );

    const {
      sub: googleId,
      given_name: firstName,
      family_name: lastName,
      email,
    } = response.data;

    const existingUser = await User.findOne({ googleId });

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
      firstName,
      lastName,
      email,
      googleId,
    });

    const token = await jwtUtility.generateAuthToken(newUser);

    return res.status(200).json({
      success: true,
      message: "Account created and logged in successfully with Google",
      data: { user: newUser, token: token },
    });
  } catch (err) {
    res.status(400).json({ message: `Invalid access token!${err.message}` });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user signed up with Google
    if (existingUser.googleId && req.body.newPassword) {
      return res.status(400).json({
        success: false,
        message: "Cannot change password for Google sign-up users",
      });
    }

    // Verify the old password if provided
    if (req.body.oldPassword) {
      const isOldPasswordCorrect = await comparePassword(
        req.body.oldPassword,
        existingUser.password
      );

      if (!isOldPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Old password is incorrect",
        });
      }
    }

    // Update first name and last name if provided in the request body
    if (req.body.firstName) {
      existingUser.firstName = req.body.firstName;
    }

    if (req.body.lastName) {
      existingUser.lastName = req.body.lastName;
    }

    // Update password if provided in the request body
    if (req.body.newPassword) {
      // Check if the new password meets the minimum length requirement
      if (req.body.newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters long",
        });
      }

      const hashedNewPassword = await hashPassword(req.body.newPassword);
      existingUser.password = hashedNewPassword;
    }

    // Save the updated user
    await existingUser.save();

    // Generate a new token with updated user information
    existingUser.password = "";
    const token = await jwtUtility.generateAuthToken(existingUser);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user: existingUser, token },
    });
  } catch (error) {
    console.error("Error in updateUser controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

exports.getRatedJobsAndCompanies = async (req, res) => {
  const { _id: userId } = req.user;

  try {
    // Step 1: Fetch rated jobs
    const featuresJobs = new APIFeatures(
      Rating.find({
        userId,
        jobId: { $exists: true },
        companyId: null,
      })
        .populate({ path: "job", select: "title slug" })
        .select("jobId parametersRating ratingAverage ratingText")
        .lean(),
      req.query
    ).paginate();

    await featuresJobs.getTotalRecords();
    const ratedJobs = await featuresJobs.query;
    const paginationInfoJobs = featuresJobs.getPaginationInfo();

    // Remove the excluded fields
    ratedJobs.forEach((job) => {
      delete job.jobId;
    });

    // Step 2: Fetch rated companies
    const featuresCompanies = new APIFeatures(
      Rating.find({
        userId,
        companyId: { $exists: true },
        jobId: null,
      })
        .populate({ path: "company", select: "name slug" })
        .select("companyId parametersRating ratingAverage ratingText")
        .lean(),
      req.query
    ).paginate();

    await featuresCompanies.getTotalRecords();
    const ratedCompanies = await featuresCompanies.query;
    const paginationInfoCompanies = featuresCompanies.getPaginationInfo();

    // Remove the excluded fields
    ratedCompanies.forEach((company) => {
      delete company.companyId;
    });
    return res.status(200).json({
      ratedJobs,
      ratedCompanies,
      paginationJobs: paginationInfoJobs,
      paginationCompanies: paginationInfoCompanies,
    });
  } catch (error) {
    console.error("Error fetching rated jobs and companies:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserRatingForJob = async (req, res) => {
  const { _id: userId } = req.user;
  const { slug: jobSlug } = req.params;

  try {
    const job = await Job.findOne({ slug: jobSlug }).populate("companyDetails");

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found with the specified slug.",
      });
    }

    const userRatingForJob = await Rating.findOne({
      userId,
      jobId: job._id,
    })
      .select("parametersRating jobId ratingAverage ratingText")
      .lean();

    const jobTitle = job.title;
    const companyTitle = job.companyDetails.name;
    const jobId = job._id;

    if (!userRatingForJob) {
      return res.status(200).json({
        success: true,
        data: {
          jobTitle,
          companyTitle,
          jobId,
          message: "User rating not found for the specified job.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userRatingForJob,
        jobTitle,
        companyTitle,
        jobId,
      },
    });
  } catch (error) {
    console.error("Error fetching user rating for job:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserRatingForCompany = async (req, res) => {
  const { _id: userId } = req.user;
  const { slug: companySlug } = req.params;

  try {
    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found with the specified slug.",
      });
    }

    const userRatingForCompany = await Rating.findOne({
      userId,
      companyId: company._id,
    })
      .select("parametersRating companyId ratingAverage ratingText")
      .lean();

    const companyTitle = company.name;
    const companyLocation = company.location;
    const companyId = company._id;

    if (!userRatingForCompany) {
      return res.status(200).json({
        success: true,
        data: {
          companyTitle,
          companyLocation,
          companyId,
          message: "User rating not found for the specified company.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userRatingForCompany,
        companyTitle,
        companyLocation,
        companyId,
      },
    });
  } catch (error) {
    console.error("Error fetching user rating for company:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
