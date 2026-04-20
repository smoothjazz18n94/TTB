const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    accountNumber: {
      type: String,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    avatarColor: {
      type: String,
      default: "#4CAF50",
    },

    transactionLimit: {
      type: Number,
      default: 10000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 💳 CARDS
    cards: [
      {
        cardNumber: String,
        expiry: { type: String, default: "12/28" },
        cvv: Number,
        balance: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🏦 VIRTUAL ACCOUNTS
    virtualAccounts: [
      {
        name: String,
        accountNumber: String,
        balance: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🔐 KYC FIELDS
    kycStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    kycReference: { type: String, default: null },
    kycApprovedAt: { type: Date, default: null },
    kycRejectionReason: { type: String, default: null },

    kyc: {
      firstName: String,
      lastName: String,
      dob: String,
      nationality: String,
      address: String,
      phone: String,
      docType: String,
      docNumber: String,
      submittedAt: String,
    },
  },
  { timestamps: true }
);

/* =========================
   AUTO ACCOUNT NUMBER
========================= */
userSchema.pre("save", function (next) {
  if (!this.accountNumber) {
    this.accountNumber =
      "TB" + Math.floor(1000000000 + Math.random() * 9000000000);
  }
  next();
});

/* =========================
   HASH PASSWORD
========================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* =========================
   COMPARE PASSWORD
========================= */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/* =========================
   HIDE PASSWORD IN RESPONSE
========================= */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);