// =====================
// 🔐 AUTH CHECK
// =====================
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// =====================
// 🔔 NOTIFICATION SYSTEM
// =====================
function notify(message, type = "info") {
  const box = document.createElement("div");

  box.textContent = message;

  box.style.position = "fixed";
  box.style.bottom = "80px";
  box.style.left = "50%";
  box.style.transform = "translateX(-50%)";
  box.style.padding = "12px 20px";
  box.style.borderRadius = "12px";
  box.style.color = "white";
  box.style.fontWeight = "600";
  box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
  box.style.animation = "fadeIn 0.3s ease";
  box.style.zIndex = "1000";

  if (type === "success") box.style.background = "#16a34a";
  else if (type === "error") box.style.background = "#dc2626";
  else box.style.background = "#2563eb";

  document.body.appendChild(box);

  setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 300);
  }, 2500);
}

// =====================
// 👤 LOAD USER
// =====================
function loadUser() {
  fetch("http://127.0.0.1:5000/api/transactions", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    })
    .then((data) => {
      console.log("USER DATA:", data);

      const user = data.user; // ✅ DEFINE FIRST

      if (!user) {
        console.error("User not found");
        return;
      }

      // ✅ THEN USE IT
      document.getElementById("welcome").textContent =
        "Welcome " + user.name;

      document.getElementById("accountNumber").textContent =
        user.accountNumber;

      document.getElementById("balance").textContent =
        "₵ " + user.balance;

      const cardName = document.getElementById("cardName");
      if (cardName) {
        cardName.textContent = user.name;
      }
    })
    .catch((err) => {
      console.error("USER LOAD ERROR:", err);
    });
}

let timeout;

function resetTimer() {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    notify("Session expired", "error");
    logout();
  }, 300000);
}

["click", "mousemove", "keypress"].forEach(evt =>
  document.addEventListener(evt, resetTimer)
);

resetTimer();

// =====================
// 📊 CHART
// =====================
let chart;

function renderChart(transactions) {
  const deposits = transactions
    .filter(t => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);

  const transfers = transactions
    .filter(t => t.type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  const ctx = document.getElementById("chart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Deposits", "Transfers"],
      datasets: [{
        data: [deposits, transfers]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


function toggleDark() {
  document.body.classList.toggle("dark");
}

// =====================
// 🧠 DATE FORMAT
// =====================
function formatDateTime(dateString) {
  if (!dateString) return "No time";

  const date = new Date(dateString);

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let day;

  if (date.toDateString() === today.toDateString()) {
    day = "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    day = "Yesterday";
  } else {
    day = date.toLocaleDateString();
  }

  return `${day} ${time}`;
}

// =====================
// 📜 HISTORY
// =====================
async function loadHistory() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/transactions/history", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!res.ok) return;

    const data = await res.json();

    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (!data.transactions || data.transactions.length === 0) {
      list.innerHTML = "<li>No transactions yet</li>";
      return;
    }

    data.transactions.forEach((tx) => {
      const li = document.createElement("li");

      const left = document.createElement("span");
      const right = document.createElement("span");

      // ICONS
      if (tx.type === "deposit") {
        left.textContent = "💰 Deposit";
        left.classList.add("deposit");
      } else {
        left.textContent = "💸 Transfer";
        left.classList.add("transfer");
      }

      right.textContent =
        `$ ${tx.amount} • ${formatDateTime(tx.createdAt)}`;

      li.appendChild(left);
      li.appendChild(right);

      list.appendChild(li);
    });

    // 🔥 UPDATE CHART
    renderChart(data.transactions);

  } catch (err) {
    console.error(err);
    notify("Failed to load history", "error");
  }
}

// =====================
// 💰 DEPOSIT
// =====================
async function deposit() {
  const amount = document.getElementById("amount").value;

  if (!amount || amount <= 0) {
    notify("Enter valid amount", "error");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/api/transactions/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    if (res.ok) {
      notify(data.message || "Deposit successful", "success");

      document.getElementById("balance").textContent =
        "$ " + data.balance;

      loadHistory();
    } else {
      notify(data.error || "Deposit failed", "error");
    }

  } catch (err) {
    notify("Network error", "error");
  }
}

// =====================
// 💸 TRANSFER
// =====================
async function transfer() {
  const receiverAccount = document.getElementById("receiver").value;
  const amount = document.getElementById("transferAmount").value;

  if (!receiverAccount || !amount || amount <= 0) {
    notify("Enter valid details", "error");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/api/transactions/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ receiverAccount, amount }),
    });

    const data = await res.json();

    if (res.ok) {
      notify(data.message || "Transfer successful", "success");

      document.getElementById("balance").textContent =
        "$ " + data.balance;

      loadHistory();
    } else {
      notify(data.error || "Transfer failed", "error");
    }

  } catch (err) {
    notify("Network error", "error");
  }
}

// =====================
// 🚪 LOGOUT
// =====================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}



// =====================
// 🚀 INIT
// =====================
loadUser();
loadHistory();

setInterval(() => {
  loadUser();
  loadHistory();
}, 5000);




// detect activity
document.addEventListener("mousemove", resetTimer);
document.addEventListener("keypress", resetTimer);
document.addEventListener("click", resetTimer);

resetTimer();


let startX = 0;

document.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
  let endX = e.changedTouches[0].clientX;

  // 👉 refresh
  if (endX - startX > 100) {
    notify("Refreshing...");
    loadUser();
    loadHistory();
  }

  // 👉 dark mode
  if (startX - endX > 100) {
    toggleDark();
    notify("Theme switched");
  }
});


function toggleDark() {
  document.body.classList.toggle("dark");
}

const correctPIN = "1894";

function showLock() {
  document.getElementById("lockScreen").style.display = "flex";
}

function unlock() {
  const pin = document.getElementById("pinInput").value;

  if (pin === correctPIN) {
    document.getElementById("lockScreen").style.display = "none";
  } else {
    notify("Wrong PIN", "error");
  }
}

// auto lock after 10 sec (demo)
setTimeout(showLock, 10000);

