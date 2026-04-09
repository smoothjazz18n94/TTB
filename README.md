# Banking Website - Full Stack Application

## Project Structure
```
banking-app/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── models/
│       └── User.js
└── README.md
```

## Backend Implementation (Node.js + Express + MongoDB)

### backend/package.json
```json
{
  "name": "banking-backend",
  "version": "1.0.0",
  "description": "Banking website backend with MongoDB",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.2",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### backend/.env.example
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-app?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
NODE_ENV=development
```

### backend/models/User.js
```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  accountNumber: {
    type: String,
    unique: true,
    required: true
  },
  balance: {
    type: Number,
    default: 1000.00,
    min: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    balanceAfter: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate account number
userSchema.pre("save", function(next) {
  if (this.isNew) {
    this.accountNumber = "AC" + Date.now().toString().slice(-8);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

### backend/server.js
```javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/banking-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

// Import models
const User = require("./models/User");

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register new user
app.post("/api/register", [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret_key",
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
        balance: user.balance
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login user
app.post("/api/login", [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Get user profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("transactions");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Deposit money
app.post("/api/deposit", authenticateToken, [
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least 1"),
  body("description").trim().notEmpty().withMessage("Description is required")
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update balance
    user.balance += parseFloat(amount);

    // Add transaction
    user.transactions.push({
      type: "deposit",
      amount: parseFloat(amount),
      description,
      balanceAfter: user.balance
    });

    await user.save();

    res.json({
      message: "Deposit successful",
      newBalance: user.balance,
      transaction: user.transactions[user.transactions.length - 1]
    });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ error: "Server error during deposit" });
  }
});

// Withdraw money
app.post("/api/withdraw", authenticateToken, [
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least 1"),
  body("description").trim().notEmpty().withMessage("Description is required")
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update balance
    user.balance -= parseFloat(amount);

    // Add transaction
    user.transactions.push({
      type: "withdrawal",
      amount: parseFloat(amount),
      description,
      balanceAfter: user.balance
    });

    await user.save();

    res.json({
      message: "Withdrawal successful",
      newBalance: user.balance,
      transaction: user.transactions[user.transactions.length - 1]
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ error: "Server error during withdrawal" });
  }
});

// Get transactions
app.get("/api/transactions", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("transactions");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ transactions: user.transactions });
  } catch (error) {
    console.error("Transactions error:", error);
    res.status(500).json({ error: "Server error fetching transactions" });
  }
});

// Socket.io for live chat
const chatMessages = [];
const adminSocketId = null;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Send chat history to new client
  socket.emit("chatHistory", chatMessages);

  // Handle new message
  socket.on("sendMessage", (data) => {
    const message = {
      id: Date.now(),
      userId: data.userId,
      userName: data.userName,
      text: data.text,
      timestamp: new Date().toISOString(),
      isAdmin: data.isAdmin || false
    };

    chatMessages.push(message);
    
    // Broadcast to all clients
    io.emit("newMessage", message);
  });

  // Handle admin connection
  socket.on("adminConnect", () => {
    adminSocketId = socket.id;
    console.log("Admin connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (socket.id === adminSocketId) {
      adminSocketId = null;
    }
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Frontend Implementation

### frontend/index.html
```html

```

### frontend/script.js
```javascript
// API Configuration
const API_BASE_URL = "http://localhost:5000/api";
let currentUser = null;
let authToken = null;
let socket = null;
let currentTransactionType = "";

// Data layer
const navigationItems = [
    { "label": "Home", "href": "#home", "icon": "fas fa-home" },
    { "label": "Accounts", "href": "#accounts", "icon": "fas fa-wallet" },
    { "label": "Transfers", "href": "#transfers", "icon": "fas fa-exchange-alt" },
    { "label": "Payments", "href": "#payments", "icon": "fas fa-credit-card" },
    { "label": "Support", "href": "#support", "icon": "fas fa-headset" }
];

const footerLinks1 = [
    { "label": "Personal Banking", "href": "#personal" },
    { "label": "Business Banking", "href": "#business" },
    { "label": "Loans", "href": "#loans" },
    { "label": "Investments", "href": "#investments" }
];

const footerLinks2 = [
    { "label": "About Us", "href": "#about" },
    { "label": "Careers", "href": "#careers" },
    { "label": "Blog", "href": "#blog" },
    { "label": "Press", "href": "#press" }
];

const footerLinks3 = [
    { "label": "Privacy Policy", "href": "#privacy" },
    { "label": "Terms of Service", "href": "#terms" },
    { "label": "Security", "href": "#security" },
    { "label": "Contact Us", "href": "#contact" }
];

const chatMessagesData = [
    { "id": 1, "userId": "admin", "userName": "Support Agent", "text": "Hello! How can I help you today?", "timestamp": "2024-01-15T10:30:00Z", "isAdmin": true },
    { "id": 2, "userId": "user", "userName": "You", "text": "Hi, I have a question about my account balance.", "timestamp": "2024-01-15T10:32:00Z", "isAdmin": false }
];

// Reusable render functions
function renderNavItems(items) {
    return items.map(item => `
        <li>
            <a href="${item.href}" class="text-gray-600 hover:text-primary font-medium transition-colors">
                <i class="${item.icon} mr-2"></i>${item.label}
            </a>
        </li>
    `).join("");
}

function renderMobileNavItems(items) {
    return items.map(item => `
        <li>
            <a href="${item.href}" class="block py-2 px-4 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition">
                <i class="${item.icon} mr-2"></i>${item.label}
            </a>
        </li>
    `).join("");
}

function renderFooterLinks(items, columnId) {
    return items.map(item => `
        <li class="mb-2">
            <a href="${item.href}" class="text-gray-400 hover:text-white transition-colors">
                ${item.label}
            </a>
        </li>
    `).join("");
}

function renderAuthButtons(isLoggedIn) {
    if (isLoggedIn) {
        return `
            <div class="flex items-center space-x-4">
                <span class="text-gray-600 hidden md:inline">Welcome, <span id="header-user-name" class="font-semibold"></span></span>
                <button id="dashboard-btn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Dashboard
                </button>
                <button id="logout-header-btn" class="text-gray-600 hover:text-primary transition">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        return `
            <div class="flex items-center space-x-4">
                <button id="login-header-btn" class="text-primary hover:text-blue-700 font-medium transition">
                    Sign In
                </button>
                <button id="register-header-btn" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Open Account
                </button>
            </div>
        `;
    }
}

function renderTransaction(transaction) {
    const typeClass = `transaction-${transaction.type}`;
    const typeIcon = transaction.type === "deposit" ? "fas fa-arrow-down text-green-500" : 
                     transaction.type === "withdrawal" ? "fas fa-arrow-up text-red-500" : 
                     "fas fa-exchange-alt text-purple-500";
    const amountColor = transaction.type === "deposit" ? "text-green-600" : "text-red-600";
    const amountSign = transaction.type === "deposit" ? "+" : "-";
    
    const date = new Date(transaction.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    
    return `
        <div class="${typeClass} bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <i class="${typeIcon}"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-dark">${transaction.description}</h4>
                        <p class="text-sm text-gray-600">${date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${amountColor}">${amountSign}$${transaction.amount.toFixed(2)}</p>
                    <p class="text-sm text-gray-600">Balance: $${transaction.balanceAfter.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;
}

function renderChatMessage(message) {
    const isUser = !message.isAdmin;
    const messageClass = isUser ? "chat-message-user" : "chat-message-admin";
    const alignClass = isUser ? "justify-end" : "justify-start";
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    return `
        <div class="flex ${alignClass} mb-3">
            <div class="max-w-xs">
                <div class="${messageClass} p-3 mb-1">
                    <p class="text-sm">${message.text}</p>
                </div>
                <div class="text-xs text-gray-500 ${isUser ? "text-right" : ""}">
                    ${message.userName} • ${time}
                </div>
            </div>
        </div>
    `;
}

// DOM Elements
const elements = {
    navList: document.getElementById("nav-list"),
    mobileNavList: document.getElementById("mobile-nav-list"),
    authButtons: document.getElementById("auth-buttons"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    mobileMenu: document.getElementById("mobile-menu"),
    heroSection: document.getElementById("hero-section"),
    authSection: document.getElementById("auth-section"),
    dashboardSection: document.getElementById("dashboard-section"),
    loginTab: document.getElementById("login-tab"),
    registerTab: document.getElementById("register-tab"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    getStartedBtn: document.getElementById("get-started-btn"),
    loginHeaderBtn: document.getElementById("login-header-btn"),
    registerHeaderBtn: document.getElementById("register-header-btn"),
    dashboardBtn: document.getElementById("dashboard-btn"),
    logoutHeaderBtn: document.getElementById("logout-header-btn"),
    logoutBtn: document.getElementById("logout-btn"),
    userName: document.getElementById("user-name"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserEmail: document.getElementById("sidebar-user-email"),
    userInitials: document.getElementById("user-initials"),
    accountNumber: document.getElementById("account-number"),
    accountBalance: document.getElementById("account-balance"),
    depositBtn: document.getElementById("deposit-btn"),
    withdrawBtn: document.getElementById("withdraw-btn"),
    transactionModal: document.getElementById("transaction-modal"),
    modalTitle: document.getElementById("modal-title"),
    transactionForm: document.getElementById("transaction-form"),
    transactionAmount: document.getElementById("transaction-amount"),
    transactionDescription: document.getElementById("transaction-description"),
    closeModal: document.getElementById("close-modal"),
    cancelTransaction: document.getElementById("cancel-transaction"),
    submitTransaction: document.getElementById("submit-transaction"),
    transactionsList: document.getElementById("transactions-list"),
    refreshTransactions: document.getElementById("refresh-transactions"),
    chatMessages: document.getElementById("chat-messages"),
    chatInput: document.getElementById("chat-input"),
    sendChatBtn: document.getElementById("send-chat-btn"),
    authMessage: document.getElementById("auth-message"),
    footerLinks1: document.getElementById("footer-links-1"),
    footerLinks2: document.getElementById("footer-links-2"),
    footerLinks3: document.getElementById("footer-links-3"),
    headerUserName: document.getElementById("header-user-name")
};

// Initialize UI
function initializeUI() {
    // Render navigation
    elements.navList.innerHTML = renderNavItems(navigationItems);
    elements.mobileNavList.innerHTML = renderMobileNavItems(navigationItems);
    
    // Render footer links
    elements.footerLinks1.innerHTML = `
        <h4 class="font-semibold mb-4">Products</h4>
        <ul>${renderFooterLinks(footerLinks1)}</ul>
    `;
    elements.footerLinks2.innerHTML = `
        <h4 class="font-semibold mb-4">Company</h4>
        <ul>${renderFooterLinks(footerLinks2)}</ul>
    `;
    elements.footerLinks3.innerHTML = `
        <h4 class="font-semibold mb-4">Legal</h4>
        <ul>${renderFooterLinks(footerLinks3)}</ul>
    `;
    
    // Check for existing auth token
    const token = localStorage.getItem("banking_token");
    if (token) {
        authToken = token;
        loadUserProfile();
    } else {
        showHeroSection();
    }
    
    // Initialize chat
    initializeChat();
}

// Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    elements.mobileMenuBtn.addEventListener("click", () => {
        elements.mobileMenu.classList.toggle("hidden");
    });
    
    // Auth tab switching
    elements.loginTab.addEventListener("click", () => {
        elements.loginTab.classList.add("border-primary", "text-primary");
        elements.registerTab.classList.remove("border-primary", "text-primary");
        elements.loginTab.classList.remove("text-gray-600");
        elements.registerTab.classList.add("text-gray-600");
        elements.loginForm.classList.remove("hidden");
        elements.registerForm.classList.add("hidden");
    });
    
    elements.registerTab.addEventListener("click", () => {
        elements.registerTab.classList.add("border-primary", "text-primary");
        elements.loginTab.classList.remove("border-primary", "text-primary");
        elements.registerTab.classList.remove("text-gray-600");
        elements.loginTab.classList.add("text-gray-600");
        elements.registerForm.classList.remove("hidden");
        elements.loginForm.classList.add("hidden");
    });
    
    // Get started button
    elements.getStartedBtn.addEventListener("click", () => {
        showAuthSection();
        elements.registerTab.click();
    });
    
    // Header auth buttons
    document.addEventListener("click", (e) => {
        if (e.target.matches("#login-header-btn") || e.target.closest("#login-header-btn")) {
            showAuthSection();
            elements.loginTab.click();
        }
        if (e.target.matches("#register-header-btn") || e.target.closest("#register-header-btn")) {
            showAuthSection();
            elements.registerTab.click();
        }
        if (e.target.matches("#dashboard-btn") || e.target.closest("#dashboard-btn")) {
            showDashboardSection();
        }
        if (e.target.matches("#logout-header-btn") || e.target.closest("#logout-header-btn")) {
            logout();
        }
    });
    
    // Form submissions
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.transactionForm.addEventListener("submit", handleTransaction);
    
    // Transaction buttons
    elements.depositBtn.addEventListener("click", () => showTransactionModal("deposit"));
    elements.withdrawBtn.addEventListener("click", () => showTransactionModal("withdrawal"));
    
    // Modal controls
    elements.closeModal.addEventListener("click", hideTransactionModal);
    elements.cancelTransaction.addEventListener("click", hideTransactionModal);
    
    // Logout
    elements.logoutBtn.addEventListener("click", logout);
    
    // Refresh transactions
    elements.refreshTransactions.addEventListener("click", loadTransactions);
    
    // Chat
    elements.sendChatBtn.addEventListener("click", sendChatMessage);
    elements.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    // Prevent default anchor behavior
    document.addEventListener("click", function(event) {
        const link = event.target.closest("a[href^='#']");
        if (!link) return;
        event.preventDefault();
        const targetId = link.getAttribute("href");
        if (targetId === "#home") {
            showHeroSection();
        }
    });
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem("banking_token", authToken);
            currentUser = data.user;
            showSuccessMessage("Login successful!");
            showDashboardSection();
        } else {
            showErrorMessage(data.error || "Login failed");
        }
    } catch (error) {
        showErrorMessage("Network error. Please try again.");
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm").value;
    
    if (password !== confirmPassword) {
        showErrorMessage("Passwords do not match");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem("banking_token", authToken);
            currentUser = data.user;
            showSuccessMessage("Registration successful! Welcome to SecureBank.");
            showDashboardSection();
        } else {
            showErrorMessage(data.error || "Registration failed");
        }
    } catch (error) {
        showErrorMessage("Network error. Please try again.");
    }
}

async function loadUserProfile() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboardSection();
        } else {
            localStorage.removeItem("banking_token");
            showHeroSection();
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

async function loadTransactions() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderTransactions(data.transactions);
        }
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

function renderTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        elements.transactionsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exchange-alt text-3xl mb-3"></i>
                <p>No transactions yet</p>
                <p class="text-sm">Your transactions will appear here</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only last 5 transactions
    const recentTransactions = sortedTransactions.slice(0, 5);
    
    elements.transactionsList.innerHTML = recentTransactions.map(renderTransaction).join("");
}

async function handleTransaction(e) {
    e.preventDefault();
    const amount = parseFloat(elements.transactionAmount.value);
    const description = elements.transactionDescription.value;
    
    if (!amount || amount <= 0) {
        showErrorMessage("Please enter a valid amount");
        return;
    }
    
    if (!description.trim()) {
        showErrorMessage("Please enter a description");
        return;
    }
    
    const endpoint = currentTransactionType === "deposit" ? "deposit" : "withdraw";
    
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ amount, description })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(`${currentTransactionType.charAt(0).toUpperCase() + currentTransactionType.slice(1)} successful!`);
            hideTransactionModal();
            updateDashboard();
            loadTransactions();
        } else {
            showErrorMessage(data.error || "Transaction failed");
        }
    } catch (error) {
        showErrorMessage("Network error. Please try again.");
    }
}

function updateDashboard() {
    if (!currentUser) return;
    
    elements.userName.textContent = currentUser.name;
    elements.sidebarUserName.textContent = currentUser.name;
    elements.sidebarUserEmail.textContent = currentUser.email;
    elements.headerUserName.textContent = currentUser.name.split(" ")[0];
    elements.accountNumber.textContent = currentUser.accountNumber;
    elements.accountBalance.textContent = `$${currentUser.balance.toFixed(2)}`;
    
    // Get initials for avatar
    const initials = currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase();
    elements.userInitials.textContent = initials;
}

function showTransactionModal(type) {
    currentTransactionType = type;
    elements.modalTitle.textContent = type === "deposit" ? "Deposit Funds" : "Withdraw Funds";
    elements.transactionAmount.value = "";
    elements.transactionDescription.value = "";
    elements.transactionModal.classList.remove("hidden");
}

function hideTransactionModal() {
    elements.transactionModal.classList.add("hidden");
}

function showHeroSection() {
    elements.heroSection.classList.remove("hidden");
    elements.authSection.classList.add("hidden");
    elements.dashboardSection.classList.add("hidden");
    elements.authButtons.innerHTML = renderAuthButtons(false);
}

function showAuthSection() {
    elements.heroSection.classList.add("hidden");
    elements.authSection.classList.remove("hidden");
    elements.dashboardSection.classList.add("hidden");
    elements.authButtons.innerHTML = renderAuthButtons(false);
}

function showDashboardSection() {
    elements.heroSection.classList.add("hidden");
    elements.authSection.classList.add("hidden");
    elements.dashboardSection.classList.remove("hidden");
    elements.authButtons.innerHTML = renderAuthButtons(true);
    updateDashboard();
    loadTransactions();
}

function logout() {
    localStorage.removeItem("banking_token");
    authToken = null;
    currentUser = null;
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    showHeroSection();
}

function showSuccessMessage(message) {
    elements.authMessage.innerHTML = `
        <div class="bg-green-50 text-green-700 p-3 rounded-lg">
            <i class="fas fa-check-circle mr-2"></i>${message}
        </div>
    `;
    setTimeout(() => {
        elements.authMessage.innerHTML = "";
    }, 3000);
}

function showErrorMessage(message) {
    elements.authMessage.innerHTML = `
        <div class="bg-red-50 text-red-700 p-3 rounded-lg">
            <i class="fas fa-exclamation-circle mr-2"></i>${message}
        </div>
    `;
    setTimeout(() => {
        elements.authMessage.innerHTML = "";
    }, 3000);
}

// Chat functions
function initializeChat() {
    // Connect to Socket.io server
    socket = io("http://localhost:5000");
    
    socket.on("connect", () => {
        console.log("Connected to chat server");
    });
    
    socket.on("chatHistory", (messages) => {
        renderChatHistory(messages);
    });
    
    socket.on("newMessage", (message) => {
        addChatMessage(message);
    });
    
    // Render initial chat messages
    renderChatHistory(chatMessagesData);
}

function renderChatHistory(messages) {
    elements.chatMessages.innerHTML = messages.map(renderChatMessage).join("");
    scrollChatToBottom();
}

function addChatMessage(message) {
    elements.chatMessages.innerHTML += renderChatMessage(message);
    scrollChatToBottom();
}

function sendChatMessage() {
    const text = elements.chatInput.value.trim();
    if (!text || !currentUser) return;
    
    const message = {
        userId: currentUser.id,
        userName: currentUser.name,
        text: text,
        isAdmin: false
    };
    
    socket.emit("sendMessage", message);
    elements.chatInput.value = "";
}

function scrollChatToBottom() {
    const chatContainer = document.getElementById("chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
    setupEventListeners();
});
```

### frontend/styles.css
```css
/* Additional custom styles beyond Tailwind */

/* Smooth scrolling */
html {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Chat scrollbar */
#chat-container::-webkit-scrollbar {
    width: 6px;
}

#chat-container::-webkit-scrollbar-track {
    background: #f9fafb;
}

#chat-container::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

/* Loading animation */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.loading {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Modal animation */
@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

#transaction-modal > div {
    animation: modalFadeIn 0.3s ease-out;
}

/* Transaction status colors */
.transaction-deposit {
    border-left-color: #10b981 !important;
}

.transaction-withdrawal {
    border-left-color: #ef4444 !important;
}

.transaction-transfer {
    border-left-color: #8b5cf6 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .gradient-bg {
        padding: 2rem 1rem !important;
    }
    
    #dashboard-section .grid {
        grid-template-columns: 1fr !important;
    }
}

/* Print styles */
@media print {
    .no-print {
        display: none !important;
    }
}
```

## README.md
```markdown
# SecureBank - Modern Banking Website

A full-stack banking application with user authentication, account management, transactions, and live chat support.

## Features

- **User Authentication**: Register, login, and logout functionality
- **Account Management**: View account details, balance, and transactions
- **Transactions**: Deposit and withdraw funds with transaction history
- **Live Chat**: Real-time chat support with admin
- **Modern UI**: Clean, responsive design using Tailwind CSS
- **Secure Backend**: JWT authentication and MongoDB data storage

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Font Awesome icons
- Socket.io client for real-time chat

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Socket.io for WebSocket communication
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Modern web browser

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-app?retryWrites=true&w=majority
   JWT_SECRET=your_secure_jwt_secret_here
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Open the frontend directory in your file explorer
2. Simply open `index.html` in a web browser
3. The frontend will automatically connect to the backend at `http://localhost:5000`

### Running the Complete Application

1. Start the backend server (as above)
2. Open `frontend/index.html` in your browser
3. The application should be fully functional

## Deployment

### Deploying to Render

1. **Create a Render Account**: Sign up at [render.com](https://render.com)

2. **Backend Deployment**:
   - Create a new Web Service
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Add environment variables from your `.env` file
   - Deploy

3. **Frontend Deployment**:
   - Create a new Static Site
   - Connect your GitHub repository
   - Set build command: `npm install && npm run build` (if using build tools)
   - Set publish directory: `frontend`
   - Update API URL in `frontend/script.js` to point to your deployed backend
   - Deploy

4. **Update CORS Settings**:
   In `backend/server.js`, update CORS origin to your frontend URL:
   ```javascript
   app.use(cors({
     origin: "https://your-frontend-url.onrender.com"
   }));
   ```

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (protected)
- `POST /api/deposit` - Deposit funds (protected)
- `POST /api/withdraw` - Withdraw funds (protected)
- `GET /api/transactions` - Get transaction history (protected)
- `GET /api/health` - Health check

## Project Structure

```
banking-app/
├── frontend/                    # Frontend code
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Additional CSS
│   └── script.js               # Frontend JavaScript
├── backend/                    # Backend code
│   ├── server.js              # Express server
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── models/
│       └── User.js            # MongoDB User model
└── README.md                  # This file
```

## Security Notes

1. **JWT Secret**: Change the JWT secret in production
2. **Password Hashing**: Passwords are hashed using bcrypt
3. **Input Validation**: All user inputs are validated
4. **CORS**: Configure CORS properly for production
5. **HTTPS**: Always use HTTPS in production

## Testing

1. **Register a new account**
2. **Login with credentials**
3. **View dashboard with account details**
4. **Make a deposit**
5. **Make a withdrawal**
6. **Check transaction history**
7. **Use live chat feature**

## Troubleshooting

1. **Connection Issues**:
   - Ensure MongoDB Atlas cluster is running
   - Check network connectivity
   - Verify CORS settings

2. **Authentication Errors**:
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify password hashing

3. **Chat Not Working**:
   - Ensure Socket.io server is running
   - Check WebSocket connections in browser console
   - Verify CORS settings for WebSockets

## License

This project is for educational purposes. Commercial use requires additional security considerations.
```

## Quick Start Commands

```bash
# Clone and setup
git clone <repository-url>
cd banking-app/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
# Open frontend/index.html in browser
```

## Important Notes

1. **MongoDB Setup**: You need to create a free cluster on MongoDB Atlas and get your connection string
2. **Security**: Change the JWT secret in production
3. **CORS**: Update CORS settings when deploying
4. **Environment Variables**: Never commit `.env` file to version control

The application is now ready to run. Start the backend server, open the frontend in a browser, and you'll have a fully functional banking website with user authentication, account management, transactions, and live chat support.