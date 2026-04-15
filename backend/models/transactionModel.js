const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // ✅ Who initiated the transaction
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Type of transaction
    type: {
      type: String,
      enum: ["deposit", "transfer", "withdrawal"],
      required: true,
    },

    // ✅ Amount
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than 0"],
    },

    // ✅ For transfers — account numbers (not ObjectIds, since you use accountNumber)
    sender: {
      type: String,
      default: null,
    },

    receiver: {
      type: String,
      default: null,
    },

    // ✅ Transaction status
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },

    // ✅ Optional note (like Monzo's "Add note to payment")
    note: {
      type: String,
      default: "",
      maxlength: 100,
    },

    // ✅ Spending category (like Monzo's categories)
    category: {
      type: String,
      enum: [
        "general",
        "food",
        "transport",
        "shopping",
        "bills",
        "entertainment",
        "health",
        "savings",
      ],
      default: "general",
    },

    // ✅ Balance snapshot after transaction (useful for statement views)
    balanceAfter: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);