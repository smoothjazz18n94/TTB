const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    accountNumber: {
      type: String,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    // ✅ Monzo-style card freeze
    isFrozen: {
      type: Boolean,
      default: false,
    },

    // ✅ Profile avatar/color (like Monzo's profile initials color)
    avatarColor: {
      type: String,
      default: "#4CAF50",
    },

    // ✅ Spending limit per transaction
    transactionLimit: {
      type: Number,
      default: 10000,
    },

    // ✅ Account status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ===========