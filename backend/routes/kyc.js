const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

/* ───────── SUBMIT KYC ───────── */
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    user.kyc = req.body;
    user.kycStatus = "pending";
    user.kycReference = "VGK-" + Date.now().toString(36).toUpperCase();

    await user.save();

    res.json({
      success: true,
      status: "pending",
      reference: user.kycReference
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "KYC submission failed" });
  }
});

/* ───────── STATUS ───────── */
router.get("/status", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId);

  res.json({
    status: user.kycStatus || "none",
    reference: user.kycReference
  });
});

module.exports = router;