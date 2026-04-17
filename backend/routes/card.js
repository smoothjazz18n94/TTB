const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

// CREATE CARD
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const newCard = {
      cardNumber: "5399 " + Math.floor(1000 + Math.random() * 9000),
      expiry: "12/28",
      cvv: Math.floor(100 + Math.random() * 900),
      balance: 0,
      isActive: true,
    };

    user.cards.push(newCard);
    await user.save();

    res.json({ card: newCard });

  } catch (err) {
    console.error("CREATE CARD ERROR:", err);
    res.status(500).json({ error: "Failed to create card" });
  }
});

// GET CARDS
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ cards: user.cards });

  } catch (err) {
    console.error("GET CARDS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

module.exports = router;