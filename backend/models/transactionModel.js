const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  sender: String,
  receiver: String,
}, { timestamps: true }); // ✅ THIS LINE

module.exports = mongoose.model("Transaction", transactionSchema);