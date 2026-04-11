console.log("✅ User model loaded");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  accountNumber: String,
  balance: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);