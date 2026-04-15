const BASE_URL = "https://ttb-x042.onrender.com";

console.log("🚀 DASHBOARD LOADED");

let token = localStorage.getItem("token");

// ======================
// 🔔 NOTIFICATION SYSTEM
// ======================
function notify(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// ======================
// 👤 LOAD USER DATA
// ======================
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    console.log("USER DATA:", data);

    if (!res.ok) throw new Error(data.error);

    document.getElementById("welcome").textContent =
      `Welcome, ${data.user.name}`;

    document.getElementById("accountNumber").textContent =
      `Acc: ${data.user.accountNumber}`;

    document.getElementById("balance").textContent =
      `₵ ${data.user.balance.toFixed(2)}`;

  } catch (err) {
    console.error(err);
    notify("Failed to load user");
  }
}

// ======================
// 💸 LOAD TRANSACTIONS
// ======================
async function loadTransactions() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    console.log("HISTORY:", data);

    const list = document.getElementById("historyList");
    list.innerHTML = "";

    let deposits = 0;
    let transfers = 0;

    data.transactions.forEach((tx) => {
      const li = document.createElement("li");

      const date = new Date(tx.createdAt).toLocaleString();

      li.innerHTML = `
        <strong>${tx.type.toUpperCase()}</strong> - ₵${tx.amount}
        <br><small>${date}</small>
      `;

      list.appendChild(li);

      if (tx.type === "deposit") deposits += tx.amount;
      if (tx.type === "transfer") transfers += tx.amount;
    });

    updateChart(deposits, transfers);

  } catch (err) {
    console.error(err);
    notify("Failed to load transactions");
  }
}

// ======================
// 💰 DEPOSIT
// ======================
async function deposit() {
  const amount = document.getElementById("amount").value;

  if (!amount) return notify("Enter amount");

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

    if (!res.ok) throw new Error(data.error);

    notify("Deposit successful 💰");

    loadUser();
    loadTransactions();

  } catch (err) {
    console.error(err);
    notify("Deposit failed");
  }
}

// ======================
// 💸 TRANSFER
// ======================
async function transfer() {
  const receiver = document.getElementById("receiver").value;
  const amount = document.getElementById("transferAmount").value;

  if (!receiver || !amount) return notify("Fill all fields");

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

    if (!res.ok) throw new Error(data.error);

    notify("Transfer successful 💸");

    loadUser();
    loadTransactions();

  } catch (err) {
    console.error(err);
    notify("Transfer failed");
  }
}

// ======================
// 📊 CHART
// ======================
let chart;

function updateChart(deposits, transfers) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Deposits", "Transfers"],
      datasets: [
        {
          data: [deposits, transfers],
        },
      ],
    },
  });
}

// ======================
// 🌙 DARK MODE
// ======================
document.getElementById("toggleTheme").onclick = () => {
  document.body.classList.toggle("light");
};

// ======================
// 📱 SWIPE (MOBILE FEEL)
// ======================
let startX = 0;

document.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
  let endX = e.changedTouches[0].clientX;

  if (endX - startX > 100) notify("👉 Swiped right");
  if (startX - endX > 100) notify("👈 Swiped left");
});

// ======================
// 🔄 AUTO REFRESH (REAL-TIME FEEL)
// ======================
setInterval(() => {
  loadUser();
  loadTransactions();
}, 5000);

// ======================
// 🚀 INIT
// ======================
loadUser();
loadTransactions();