const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    accountNumber: {
      type: String,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    avatarColor: {
      type: String,
      default: "#4CAF50",
    },

    transactionLimit: {
      type: Number,
      default: 10000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ======================
// GENERATE ACCOUNT NUMBER
// ======================
userSchema.pre("save", function (next) {
  if (!this.accountNumber) {
    this.accountNumber =
      "TB" + Math.floor(100000000 + Math.random() * 900000000);
  }
  next();
});

// ======================
// HASH PASSWORD
// ======================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ======================
// COMPARE PASSWORD
// ======================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ======================
// EXPORT MODEL (CRITICAL FIX)
// ======================
module.exports = mongoose.model("User", userSchema);