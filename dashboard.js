const BASE_URL = "https://ttb-x042.onrender.com";

const token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user")) || {};

if (!token) window.location.href = "index.html";

// LOAD USER
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    console.log("USER:", data);

    user = data.user;

    document.getElementById("balanceAmount").textContent =
      "₵ " + (user.balance || 0).toFixed(2);

    document.getElementById("accountNumber").textContent =
      user.accountNumber || "N/A";

    document.getElementById("userAvatar").textContent =
      user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  } catch (err) {
    console.error(err);
  }
}

// LOAD TRANSACTIONS
async function loadTransactions() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const container = document.getElementById("transactionsList");

    if (!data.transactions?.length) {
      container.innerHTML = "<p>No transactions</p>";
      return;
    }

    container.innerHTML = data.transactions.slice(0, 5).map(t => `
      <div class="transaction-item">
        <div>
          <strong>${t.type}</strong><br/>
          <small>${new Date(t.createdAt).toLocaleDateString()}</small>
        </div>
        <div>₵ ${t.amount}</div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
  }
}

// DEPOSIT
document.getElementById("depositForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = e.target[0].value;

  await fetch(`${BASE_URL}/api/transactions/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  alert("Deposit successful");
  loadUser();
  loadTransactions();
  closeModal("deposit");
});

// TRANSFER
document.getElementById("transferForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const receiver = e.target[0].value;
  const amount = e.target[1].value;

  await fetch(`${BASE_URL}/api/transactions/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiver, amount }),
  });

  alert("Transfer successful");
  loadUser();
  loadTransactions();
  closeModal("transfer");
});

// WITHDRAW
document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = e.target[0].value;

  await fetch(`${BASE_URL}/api/transactions/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  alert("Withdraw successful");
  loadUser();
  loadTransactions();
  closeModal("withdraw");
});

// MODALS
function openModal(type) {
  document.getElementById(type + "Modal").style.display = "flex";
}

function closeModal(type) {
  document.getElementById(type + "Modal").style.display = "none";
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// INIT
window.onload = () => {
  loadUser();
  loadTransactions();
};