const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
});

userSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase();
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
