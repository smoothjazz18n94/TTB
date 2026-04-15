const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/transactionModel");
const authenticateToken = require("../middleware/authenticateToken");

// ======================
// 📜 GET TRANSACTIONS
// dashboard.js calls GET /api/transactions and expects { transactions }
// ======================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const transactions = await Transaction.find({
      $or: [
        { sender: user.accountNumber },
        { receiver: user.accountNumber },
      ],
    }).sort({ createdAt: -1 }); // ✅ fixed from date to createdAt

    res.json({ transactions });

  } catch (err) {
    console.error("GET TRANSACTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ======================
// 💰 DEPOSIT
// ======================
router.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const { amount, note, category } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Block if account is frozen
    if (user.isFrozen) {
      return res.status(403).json({ error: "Account is frozen" });
    }

    user.balance += Number(amount);
    await user.save();

    // ✅ Save transaction with all new fields
    await Transaction.create({
      userId: user._id,
      type: "deposit",
      amount: Number(amount),
      receiver: user.accountNumber,
      sender: null,
      status: "completed",
      note: note || "",
      category: category || "general",
      balanceAfter: user.balance,
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

// ======================
// 💸 TRANSFER
// ======================
router.post("/transfer", authenticateToken, async (req, res) => {
  try {
    // ✅ Accept both "receiver" (dashboard.js) and "receiverAccount" 
    const { receiver, receiverAccount, amount, note, category } = req.body;
    const targetAccount = receiver || receiverAccount;

    if (!targetAccount || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const sender = await User.findById(req.user.userId);

    if (!sender) return res.status(404).json({ error: "Sender not found" });

    // ✅ Block if account is frozen
    if (sender.isFrozen) {
      return res.status(403).json({ error: "Your account is frozen" });
    }

    // ✅ Block if amount exceeds transaction limit
    if (Number(amount) > sender.transactionLimit) {
      return res.status(400).json({
        error: `Transfer exceeds your transaction limit of ₵${sender.transactionLimit}`,
      });
    }

    // ✅ Block self-transfer
    if (sender.accountNumber === targetAccount) {
      return res.status(400).json({ error: "Cannot transfer to yourself" });
    }

    const receiverUser = await User.findOne({ accountNumber: targetAccount });

    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    if (sender.balance < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    sender.balance -= Number(amount);
    receiverUser.balance += Number(amount);

    await sender.save();
    await receiverUser.save();

    // ✅ Save transaction with all new fields
    await Transaction.create({
      userId: sender._id,
      type: "transfer",
      amount: Number(amount),
      sender: sender.accountNumber,
      receiver: receiverUser.accountNumber,
      status: "completed",
      note: note || "",
      category: category || "general",
      balanceAfter: sender.balance,
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

// ======================
// 📜 HISTORY (dedicated route)
// ======================
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const transactions = await Transaction.find({
      $or: [
        { sender: user.accountNumber },
        { receiver: user.accountNumber },
      ],
    }).sort({ createdAt: -1 }); // ✅ fixed from date to createdAt

    res.json({ transactions });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ======================
// 🧊 FREEZE / UNFREEZE ACCOUNT
// ======================
router.patch("/freeze", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    user.isFrozen = !user.isFrozen;
    await user.save();

    res.json({
      message: user.isFrozen ? "Account frozen ❄️" : "Account unfrozen ✅",
      isFrozen: user.isFrozen,
    });

  } catch (err) {
    console.error("FREEZE ERROR:", err);
    res.status(500).json({ error: "Failed to update account status" });
  }
});

module.exports = router;