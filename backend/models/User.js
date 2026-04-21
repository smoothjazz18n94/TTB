const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  cardNumber: String,
  expiry: String,
  cvv: String,
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const virtualAccountSchema = new mongoose.Schema({
  name: String,
  accountNumber: String,
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  accountNumber: String,
  balance: { type: Number, default: 0 },

  kycStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none"
  },

  kycReference: String,
  kycData: Object,

  cards: [cardSchema],
  virtualAccounts: [virtualAccountSchema]
});

module.exports = mongoose.model("User", userSchema);