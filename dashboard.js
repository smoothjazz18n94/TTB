console.log("DASHBOARD JS LOADED");

const BASE_URL = "https://ttb-x042.onrender.com";

const token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user")) || {};

// ======================
// AUTH CHECK
// ======================
if (!token) {
  window.location.href = "index.html";
}

// ======================
// LOAD USER DATA
// ======================
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    console.log("USER DATA:", data);

    user = data.user;

    document.getElementById("balanceAmount").textContent =
      "₵ " + (user.balance || 0).toFixed(2);

    document.getElementById("accountNumber").textContent =
      user.accountNumber || "N/A";

    document.getElementById("userAvatar").textContent =
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

  } catch (err) {
    console.error("LOAD USER ERROR:", err);
  }
}

// ======================
// LOAD TRANSACTIONS
// ======================
async function loadTransactions() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    console.log("TRANSACTIONS:", data);

    const container = document.getElementById("transactionsList");

    if (!data.transactions || data.transactions.length === 0) {
      container.innerHTML = "<p>No transactions yet</p>";
      return;
    }

    container.innerHTML = data.transactions
      .slice(0, 5)
      .map((t) => {
        return `
        <div class="transaction-item">
          <div>
            <strong>${t.type.toUpperCase()}</strong><br/>
            <small>${new Date(t.createdAt).toLocaleDateString()}</small>
          </div>
          <div>
            ₵ ${t.amount}
          </div>
        </div>
      `;
      })
      .join("");

  } catch (err) {
    console.error("TRANSACTION ERROR:", err);
  }
}

// ======================
// DEPOSIT
// ======================
document.getElementById("depositForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = e.target[0].value;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    console.log("DEPOSIT:", data);

    alert("Deposit successful 💰");

    loadUser();
    loadTransactions();
    closeModal("deposit");

  } catch (err) {
    console.error("DEPOSIT ERROR:", err);
  }
});

// ======================
// SEND MONEY
// ======================
document.getElementById("transferForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const receiver = e.target[0].value;
  const amount = e.target[1].value;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiver, amount }),
    });

    const data = await res.json();

    console.log("TRANSFER:", data);

    alert("Transfer successful 💸");

    loadUser();
    loadTransactions();
    closeModal("transfer");

  } catch (err) {
    console.error("TRANSFER ERROR:", err);
  }
});

// ======================
// WITHDRAW
// ======================
document.getElementById("withdrawForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = e.target[0].value;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    console.log("WITHDRAW:", data);

    alert("Withdraw successful 💸");

    loadUser();
    loadTransactions();
    closeModal("withdraw");

  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
  }
});

// ======================
// MODALS
// ======================
function openModal(type) {
  document.getElementById(`${type}Modal`).style.display = "flex";
}

function closeModal(type) {
  document.getElementById(`${type}Modal`).style.display = "none";
}

// ======================
// LOGOUT
// ======================
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ======================
// INIT
// ======================
window.onload = () => {
  loadUser();
  loadTransactions();
};