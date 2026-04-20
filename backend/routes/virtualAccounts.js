const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

/* ───────── GET ACCOUNTS ───────── */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ accounts: user.virtualAccounts || [] });

  } catch (err) {
    console.error("GET VA ERROR:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

/* ───────── CREATE ACCOUNT ───────── */
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Account name is required" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newVA = {
      name,
      accountNumber: "VA" + Math.floor(100000000 + Math.random() * 900000000),
      balance: 0,
      createdAt: new Date(),
    };

    user.virtualAccounts.push(newVA);
    await user.save();

    res.status(201).json({ account: newVA });

  } catch (err) {
    console.error("CREATE VA ERROR:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

/* ───────── DELETE ACCOUNT ───────── */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.virtualAccounts = user.virtualAccounts.filter(
      acc => acc._id?.toString() !== req.params.id
    );

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE VA ERROR:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;