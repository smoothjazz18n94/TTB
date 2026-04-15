const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true, minlength: 6 },

    accountNumber: { type: String, unique: true },

    balance: { type: Number, default: 0 },

    isFrozen: { type: Boolean, default: false },

    avatarColor: { type: String, default: "#4CAF50" },

    transactionLimit: { type: Number, default: 10000 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate account number + hash password
userSchema.pre("save", async function (next) {
  if (!this.accountNumber) {
    this.accountNumber =
      "10" + Math.floor(100000000 + Math.random() * 900000000);
  }

  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);