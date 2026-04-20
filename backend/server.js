require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const cardRoutes = require("./routes/cards");
const virtualRoutes = require("./routes/virtualAccounts");

const app = express();

// ======================
// CORS CONFIG
// ======================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://ttb-git-master-smoothjazz18n94s-projects.vercel.app",
  "https://vaultgreenbank.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps / Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());

// ======================
// ROUTES
// ======================
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/api/cards", cardRoutes);
app.use("/api/virtual-accounts", virtualRoutes);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ======================
// DATABASE CONNECTION
// ======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  });

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);

  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});