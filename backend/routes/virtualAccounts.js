const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

// CREATE VIRTUAL ACCOUNT
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.userId);

    const newVA = {
      name,
      accountNumber: "VA" + Math.floor(100000000 + Math.random() * 900000000),
      balance: 0,
    };

    user.virtualAccounts.push(newVA);
    await user.save();

    res.json({ account: newVA });

  } catch (err) {
    console.error("CREATE VA ERROR:", err);
    res.status(500).json({ error: "Failed to create virtual account" });
  }
});

// GET VIRTUAL ACCOUNTS
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ accounts: user.virtualAccounts });

  } catch (err) {
    console.error("GET VA ERROR:", err);
    res.status(500).json({ error: "Failed to fetch virtual accounts" });
  }
});

module.exports = router;