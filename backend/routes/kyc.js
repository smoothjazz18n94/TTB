/* ══════════════════════════════════════════════════
   VAULTGREEN — routes/kyc.js
   KYC submission, status check, admin review
══════════════════════════════════════════════════ */

const express           = require("express");
const router            = express.Router();
const User              = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

/* ──────────────────────────────────────────
   POST /api/kyc/submit
   Submit KYC documents for review
────────────────────────────────────────── */
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const {
      firstName, lastName, dob, nationality,
      address, phone, docType, docNumber, submittedAt,
    } = req.body;

    if (!firstName || !lastName)   return res.status(400).json({ error: "Full name is required" });
    if (!dob)                      return res.status(400).json({ error: "Date of birth is required" });
    if (!docType || !docNumber)    return res.status(400).json({ error: "Document details are required" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Prevent re-submission if already approved
    if (user.kycStatus === "approved") {
      return res.status(400).json({ error: "KYC already approved" });
    }

    // Save KYC data to user
    user.kyc = {
      firstName, lastName, dob, nationality,
      address, phone, docType, docNumber,
      submittedAt: submittedAt || new Date().toISOString(),
    };
    user.kycStatus = "pending";

    // Generate KYC reference
    user.kycReference = "VGK-" + Date.now().toString(36).toUpperCase();

    await user.save();

    console.log(`✅ KYC submitted: ${user.email} — Ref: ${user.kycReference}`);

    res.status(201).json({
      success:    true,
      reference:  user.kycReference,
      status:     "pending",
      message:    "KYC submitted. Review typically takes 2–4 hours.",
    });

  } catch (err) {
    console.error("❌ KYC submit error:", err);
    res.status(500).json({ error: "Failed to submit KYC" });
  }
});

/* ──────────────────────────────────────────
   GET /api/kyc/status
   Get current KYC status for the logged-in user
────────────────────────────────────────── */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("kycStatus kycReference kyc");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      status:    user.kycStatus || "none",
      reference: user.kycReference,
      kyc:       user.kycStatus === "approved" ? user.kyc : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch KYC status" });
  }
});

/* ──────────────────────────────────────────
   PATCH /api/kyc/review/:userId
   Admin: approve or reject KYC
   (protect this with admin middleware in production)
────────────────────────────────────────── */
router.patch("/review/:userId", authenticateToken, async (req, res) => {
  try {
    const { decision, reason } = req.body; // decision: "approved" | "rejected"
    if (!["approved","rejected"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'approved' or 'rejected'" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.kycStatus = decision;
    if (decision === "rejected") user.kycRejectionReason = reason || "Documents unclear";
    if (decision === "approved") user.kycApprovedAt = new Date();

    await user.save();

    console.log(`✅ KYC ${decision}: ${user.email}`);
    res.json({ success: true, userId: user._id, status: user.kycStatus });

  } catch (err) {
    res.status(500).json({ error: "Failed to update KYC" });
  }
});

module.exports = router;








