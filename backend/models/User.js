const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 1. CREATE SCHEMA FIRST
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  accountNumber: {
    type: String,
    unique: true,
    default: () =>
      Math.floor(1000000000 + Math.random() * 9000000000).toString(),
  },

  balance: {
    type: Number,
    default: 0,
  },
});

// 2. ADD MIDDLEWARE AFTER SCHEMA
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  console.log("🔐 Hashing password...");

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 3. ADD METHODS
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// 4. EXPORT MODEL LAST
module.exports = mongoose.model("User", userSchema);