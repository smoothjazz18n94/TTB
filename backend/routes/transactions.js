const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Transaction = require("../models/transactionModel");

// 🔐 Auth middleware
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ✅ GET USER DATA
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user }); // ✅ must send user
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
// 💰 DEPOSIT
router.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findById(req.user.userId);

    user.balance += Number(amount);
    await user.save();

    // ✅ SAVE TRANSACTION
    await Transaction.create({
      type: "deposit",
      amount: Number(amount),
      receiver: user.accountNumber,
    });

    res.json({
      message: "Deposit successful",
      balance: user.balance,
    });

  } catch (err) {
    console.error("DEPOSIT ERROR:", err);
    res.status(500).json({ error: "Deposit failed" });
  }
});

// 💸 TRANSFER
router.post("/transfer", authenticateToken, async (req, res) => {
  try {
    const { receiverAccount, amount } = req.body;

    if (!receiverAccount || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const sender = await User.findById(req.user.userId);
    const receiver = await User.findOne({ accountNumber: receiverAccount });

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    sender.balance -= Number(amount);
    receiver.balance += Number(amount);

    await sender.save();
    await receiver.save();

    // ✅ SAVE TRANSACTION
    await Transaction.create({
      type: "transfer",
      amount: Number(amount),
      sender: sender.accountNumber,
      receiver: receiver.accountNumber,
    });

    res.json({
      message: "Transfer successful",
      balance: sender.balance,
    });

  } catch (err) {
    console.error("TRANSFER ERROR:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// 📜 HISTORY
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const transactions = await Transaction.find({
      $or: [
        { sender: user.accountNumber },
        { receiver: user.accountNumber },
      ],
    }).sort({ date: -1 });

    console.log("HISTORY:", transactions);

    res.json({ transactions });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;