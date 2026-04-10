const BASE_URL = "https://bank-backend.onrender.com";
const token = localStorage.getItem("token");

// ================= USER =================
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("USER DATA:", data);

    if (!res.ok) {
      showNotification("User not found. Login again.");
      return;
    }

    document.getElementById("welcome").innerText =
      "Welcome, " + (data.name || "User");

    document.getElementById("accountNumber").innerText =
      "Acc: " + (data.accountNumber || "N/A");

    document.getElementById("balance").innerText =
      "₵ " + (data.balance || 0);
  } catch (err) {
    console.error("USER LOAD ERROR:", err);
    showNotification("Failed to load user");
  }
}

// ================= HISTORY =================
async function loadHistory() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

      li.innerHTML = `
        <strong>${tx.type}</strong> - ₵${tx.amount}
        <br><small>${date}</small>
      `;

      list.appendChild(li);
    });
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    showNotification("Failed to load history");
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    if (res.ok) {
      showNotification("Deposit successful");
      loadUser();
      loadHistory();
    } else {
      showNotification(data.message || "Deposit failed");
    }
  } catch (err) {
    console.error("DEPOSIT ERROR:", err);
  }
}

// ================= TRANSFER =================
async function transfer() {
  const receiver = document.getElementById("receiver").value;
  const amount = document.getElementById("transferAmount").value;

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

    if (res.ok) {
      showNotification("Transfer successful");
      loadUser();
      loadHistory();
    } else {
      showNotification(data.message || "Transfer failed");
    }
  } catch (err) {
    console.error("TRANSFER ERROR:", err);
  }
}

// ================= NOTIFICATION =================
function showNotification(message) {
  const note = document.createElement("div");
  note.className = "notification";
  note.innerText = message;

  document.body.appendChild(note);

  setTimeout(() => {
    note.remove();
  }, 3000);
}

// ================= INIT =================
loadUser();
loadHistory();