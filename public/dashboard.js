const BASE_URL = "https://bank-backend.onrender.com"; // 🔥 change if needed
const token = localStorage.getItem("token");

// 🔐 Redirect if no token
if (!token) {
  window.location.href = "login.html";
}

// ================= LOAD USER =================
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    console.log("USER DATA:", data);

    if (!res.ok) {
      alert("User not found, login again");
      return;
    }

    const user = data.user;

    document.getElementById("welcome").innerText =
      "Welcome " + user.name;

    document.getElementById("accountNumber").innerText =
      user.accountNumber;

    document.getElementById("balance").innerText =
      "₵ " + user.balance;

  } catch (err) {
    console.error("USER ERROR:", err);
  }
}

// ================= DEPOSIT =================
async function deposit() {
  const amount = document.getElementById("amount").value;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Deposit successful");
      loadUser();
      loadHistory();
    } else {
      alert(data.error || "Deposit failed");
    }
  } catch (err) {
    console.error("DEPOSIT ERROR:", err);
  }
}

// ================= TRANSFER =================
async function transfer() {
  const receiverAccount = document.getElementById("receiver").value;
  const amount = document.getElementById("transferAmount").value;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ receiverAccount, amount }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Transfer successful");
      loadUser();
      loadHistory();
    } else {
      alert(data.error || "Transfer failed");
    }
  } catch (err) {
    console.error("TRANSFER ERROR:", err);
  }
}

// ================= HISTORY =================
async function loadHistory() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/history`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    console.log("HISTORY:", data);

    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (!data.transactions || data.transactions.length === 0) {
      list.innerHTML = "<li>No transactions yet</li>";
      return;
    }

    data.transactions.forEach((tx) => {
      const li = document.createElement("li");

      const date = new Date(tx.createdAt).toLocaleString();

      li.textContent = `${tx.type} - ₵${tx.amount} (${date})`;

      list.appendChild(li);
    });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
  }
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// ================= INIT =================
loadUser();
loadHistory();