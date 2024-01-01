const mongoose = require("mongoose");

const userRatingActionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  actionType: {
    type: String,
    enum: ["thumbsUp", "thumbsDown", "isReported"],
  },
  ratingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rating",
  },
});

userRatingActionSchema.index({ userId: 1, ratingId: 1 }, { unique: true });

const UserRatingAction = mongoose.model(
  "UserRatingAction",
  userRatingActionSchema
);

module.exports = UserRatingAction;
