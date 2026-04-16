const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ======================
// USER SCHEMA
// ======================
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
      min: 0,
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
// AUTO GENERATE ACCOUNT NUMBER
// ======================
userSchema.pre("save", function () {
  if (!this.accountNumber) {
    this.accountNumber =
      "TB" + Math.floor(1000000000 + Math.random() * 9000000000);
  }
});

// ======================
// HASH PASSWORD BEFORE SAVE
// ======================
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ======================
// COMPARE PASSWORD
// ======================
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
// ======================
// REMOVE PASSWORD FROM JSON OUTPUT
// ======================
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// ======================
// EXPORT MODEL
// ======================
module.exports = mongoose.model("User", userSchema);