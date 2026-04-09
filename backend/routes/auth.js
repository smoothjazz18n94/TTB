const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================
// REGISTER USER
// ======================
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("❌ Validation Errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("✅ REGISTER ROUTE HIT");

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("❌ Email already exists");
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user (accountNumber handled in model)
      const user = new User({
        name,
        email,
        password,
      });

      console.log("🧪 User before save:", user);

      await user.save();

      console.log("✅ User saved successfully");

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "Registration successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountNumber: user.accountNumber,
          balance: user.balance,
        },
      });
    } catch (error) {
      console.log("❌ REGISTRATION FAILED");
      console.log(error);
      console.log("STACK:", error.stack);

      res.status(500).json({
        error: error.message || "Server error during registration",
      });
    }
  }
);

// ======================
// LOGIN USER
// ======================
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("❌ Login validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log("✅ LOGIN ROUTE HIT");

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        console.log("❌ User not found");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log("❌ Password incorrect");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      console.log("✅ Login successful");

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountNumber: user.accountNumber,
          balance: user.balance,
        },
      });
    } catch (error) {
      console.log("❌ LOGIN FAILED");
      console.log(error);
      console.log("STACK:", error.stack);

      res.status(500).json({
        error: error.message || "Server error during login",
      });
    }
  }
);

module.exports = router;