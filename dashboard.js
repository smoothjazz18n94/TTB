/* ═══════════════════════════════════════════
   TRUST BANK — DASHBOARD JS
   Connects to: https://ttb-x042.onrender.com
════════════════════════════════════════════ */

const BASE_URL = "https://ttb-x042.onrender.com";

let token       = localStorage.getItem("token");
let currentUser = null;
let isFrozen    = false;
let balHidden   = false;
let myChart     = null;
let chartMode   = "doughnut";
let allTx       = [];

// Redirect immediately if not logged in
if (!token) window.location.href = "login.html";

/* ═══════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function notify(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = type;
  t.style.display = "block";
  clearTimeout(t._tid);
  t._tid = setTimeout(() => (t.style.display = "none"), 3200);
}

/* ═══════════════════════════════════════════
   SHEET HELPERS
════════════════════════════════════════════ */
function openSheet(name) {
  const ids = {
    deposit:  "depositOverlay",
    transfer: "transferOverlay",
    limit:    "limitOverlay",
  };
  document.getElementById(ids[name])?.classList.add("open");
}

function closeSheet(id) {
  document.getElementById(id)?.classList.remove("open");
}

function closeOnBackdrop(e, id) {
  if (e.target === e.currentTarget) closeSheet(id);
}

/* ═══════════════════════════════════════════
   UTILS
════════════════════════════════════════════ */
function avatarColor(name) {
  const palette = [
    "#4f63f0","#7c5cf6","#ec4899",
    "#06b6d4","#0ecb81","#f5a623",
    "#f0506e","#14b8a6",
  ];
  let hash = 0;
  for (const ch of (name || "")) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/* ═══════════════════════════════════════════
   LOAD USER
════════════════════════════════════════════ */
async function loadUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ /me", res.status, txt);
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "login.html";
      }
      return;
    }

    const { user } = await res.json();
    currentUser = user;

    // Avatar
    const initials = (user.name || "TB")
      .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const av = document.getElementById("avatarEl");
    av.textContent        = initials;
    av.style.background   = avatarColor(user.name);

    // Header
    document.getElementById("welcome").textContent =
      `Hey, ${user.name.split(" ")[0]} 👋`;
    document.getElementById("accountNumber").textContent =
      user.accountNumber;

    // Balance
    document.getElementById("balanceEl").innerHTML =
      `<span>₵ ${(user.balance || 0).toFixed(2)}</span>`;
    if (balHidden) document.getElementById("balanceEl").classList.add("blurred");

    // Card last four
    document.getElementById("lastFour").textContent =
      (user.accountNumber || "----").slice(-4);

    // Freeze state
    isFrozen = user.isFrozen || false;
    syncFreezeUI();

    // Pre-fill limit input
    if (user.transactionLimit) {
      document.getElementById("limitAmount").value = user.transactionLimit;
    }

  } catch (err) {
    console.error("❌ loadUser crash", err);
    notify("Failed to load account", "error");
  }
}

/* ═══════════════════════════════════════════
   FREEZE UI
════════════════════════════════════════════ */
function syncFreezeUI() {
  document.getElementById("freezeBadge").classList.toggle("visible", isFrozen);
  document.getElementById("freezeIcon").textContent  = isFrozen ? "🔥" : "❄";
  document.getElementById("freezeLabel").textContent = isFrozen ? "Unfreeze" : "Freeze";
}

/* ═══════════════════════════════════════════
   LOAD TRANSACTIONS
════════════════════════════════════════════ */
async function loadTransactions() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("❌ /transactions", res.status);
      return;
    }

    const { transactions = [] } = await res.json();
    allTx = Array.isArray(transactions) ? transactions : [];

    renderTxList(allTx);
    renderStats(allTx);
    renderChart(allTx);

  } catch (err) {
    console.error("❌ loadTransactions crash", err);
    notify("Failed to load transactions", "error");
  }
}


// ======================
// LOAD CARDS
// ======================
async function loadCards() {
  try {
    const res = await fetch(`${BASE_URL}/api/cards`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { cards = [] } = await res.json();

    console.log("💳 Cards:", cards);

    const el = document.getElementById("cardsList");

    if (!cards.length) {
      el.innerHTML = "<p>No cards yet</p>";
      return;
    }

    el.innerHTML = cards.map(card => `
      <div class="card-box">
        <p>**** ${card.cardNumber.slice(-4)}</p>
        <small>Expiry: ${card.expiry}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error("Cards error:", err);
  }
}


// ======================
// LOAD VIRTUAL ACCOUNTS
// ======================
async function loadVirtualAccounts() {
  try {
    const res = await fetch(`${BASE_URL}/api/virtual-accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { accounts = [] } = await res.json();

    console.log("🏦 Virtual Accounts:", accounts);

    const el = document.getElementById("vaList");

    if (!accounts.length) {
      el.innerHTML = "<p>No virtual accounts</p>";
      return;
    }

    el.innerHTML = accounts.map(acc => `
      <div class="va-box">
        <p>${acc.name}</p>
        <small>${acc.accountNumber}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error("VA error:", err);
  }
}


/* ═══════════════════════════════════════════
   RENDER TRANSACTION LIST
════════════════════════════════════════════ */
function renderTxList(txs) {
  const list = document.getElementById("historyList");

  if (!txs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-glyph">◈</div>
        <p>No transactions yet</p>
        <small>Your activity will appear here</small>
      </div>`;
    return;
  }

  const acct    = currentUser?.accountNumber;
  const iconMap = { deposit: "💰", transfer: "💸", withdrawal: "🏧" };

  list.innerHTML = txs.slice(0, 20).map((tx, i) => {
    const isCredit = tx.type === "deposit" ||
      (tx.type === "transfer" && tx.receiver === acct);

    const title = tx.type === "deposit"
      ? "Deposit"
      : tx.type === "transfer"
        ? (isCredit ? `From ${tx.sender || "Unknown"}` : `To ${tx.receiver || "Unknown"}`)
        : "Withdrawal";

    const cat   = tx.category || "general";
    const icon  = iconMap[tx.type] || "💳";
    const delay = i * 35;

    return `
      <div class="tx-row" onclick="openTxDetail(${i})" style="animation-delay:${delay}ms">
        <div class="tx-badge ${tx.type}">${icon}</div>
        <div class="tx-info">
          <p class="tx-name">${title}</p>
          <div class="tx-meta">
            <span>${fmtDate(tx.createdAt)}, ${fmtTime(tx.createdAt)}</span>
            <span class="cat-tag ct-${cat}">${cat}</span>
          </div>
        </div>
        <div class="tx-nums">
          <p class="tx-amt ${isCredit ? "cr" : "dr"}">${isCredit ? "+" : "−"}₵${tx.amount.toFixed(2)}</p>
          ${tx.balanceAfter != null
            ? `<p class="tx-bal">₵${tx.balanceAfter.toFixed(2)}</p>`
            : ""}
        </div>
      </div>`;
  }).join("");
}

/* ═══════════════════════════════════════════
   TX DETAIL SHEET
════════════════════════════════════════════ */
function openTxDetail(idx) {
  const tx = allTx[idx];
  if (!tx) return;

  const acct     = currentUser?.accountNumber;
  const isCredit = tx.type === "deposit" ||
    (tx.type === "transfer" && tx.receiver === acct);

  const titleMap = { deposit:"💰 Deposit", transfer:"💸 Transfer", withdrawal:"🏧 Withdrawal" };
  document.getElementById("txDetailTitle").textContent =
    `${titleMap[tx.type] || "Transaction"} Details`;

  const rows = [
    ["Amount",        `${isCredit ? "+" : "−"}₵${tx.amount.toFixed(2)}`],
    ["Type",          tx.type.charAt(0).toUpperCase() + tx.type.slice(1)],
    ["Status",        tx.status || "Completed"],
    ["Category",      tx.category || "General"],
    tx.note     ? ["Note",          tx.note]          : null,
    tx.sender   ? ["From",          tx.sender]         : null,
    tx.receiver ? ["To",            tx.receiver]       : null,
    tx.balanceAfter != null
      ? ["Balance After", `₵${tx.balanceAfter.toFixed(2)}`] : null,
    ["Date",          fmtDateLong(tx.createdAt)],
    ["Time",          fmtTime(tx.createdAt)],
  ].filter(Boolean);

  document.getElementById("txDetailBody").innerHTML = rows.map(([k, v]) => `
    <div class="detail-row">
      <span class="detail-key">${k}</span>
      <span class="detail-val">${v}</span>
    </div>`).join("");

  document.getElementById("txDetailOverlay").classList.add("open");
}

/* ═══════════════════════════════════════════
   STATS
════════════════════════════════════════════ */
function renderStats(txs) {
  const acct = currentUser?.accountNumber;
  let totalIn = 0, totalOut = 0;

  txs.forEach(tx => {
    const credit = tx.type === "deposit" ||
      (tx.type === "transfer" && tx.receiver === acct);
    if (credit) totalIn  += tx.amount;
    else        totalOut += tx.amount;
  });

  document.getElementById("totalIn").textContent  = `₵ ${totalIn.toFixed(2)}`;
  document.getElementById("totalOut").textContent = `₵ ${totalOut.toFixed(2)}`;
}

/* ═══════════════════════════════════════════
   CHART
════════════════════════════════════════════ */
function switchChart(mode, el) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  chartMode = mode;
  renderChart(allTx);
}

function renderChart(txs) {
  const wrap = document.getElementById("chartWrap");
  if (myChart) { myChart.destroy(); myChart = null; }

  if (!txs.length) {
    wrap.innerHTML = `<div class="chart-empty">No spending data yet</div>`;
    return;
  }

  // Ensure canvas exists
  if (!document.getElementById("chartCanvas")) {
    wrap.innerHTML = `<canvas id="chartCanvas"></canvas>`;
  }
  const ctx = document.getElementById("chartCanvas").getContext("2d");

  if (chartMode === "doughnut") {
    // Group by category
    const cats = {};
    txs.forEach(tx => {
      const c = tx.category || "general";
      cats[c] = (cats[c] || 0) + tx.amount;
    });
    const labels = Object.keys(cats);
    const data   = Object.values(cats);
    const colors = [
      "#4f63f0","#0ecb81","#f5a623",
      "#ec4899","#7c5cf6","#f0506e",
      "#06b6d4","#84cc16",
    ];

    myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor:     "var(--s1, #0d1625)",
          borderWidth:     3,
          hoverBorderWidth: 4,
        }],
      },
      options: {
        cutout: "70%",
        plugins: {
          legend: {
            labels: {
              color:    "#8fa3b8",
              font:     { size: 11, family: "DM Sans" },
              padding:  14,
              boxWidth: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ₵${ctx.parsed.toFixed(2)}`,
            },
          },
        },
      },
    });

  } else {
    // 7-day bar chart
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = days.map(d =>
      d.toLocaleDateString("en-GB", { weekday: "short" })
    );
    const data = days.map(d => {
      const ds = d.toDateString();
      return txs
        .filter(tx => new Date(tx.createdAt).toDateString() === ds)
        .reduce((sum, tx) => sum + tx.amount, 0);
    });

    myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label:           "Activity (₵)",
          data,
          backgroundColor: "rgba(79,99,240,0.70)",
          borderRadius:    8,
          borderSkipped:   false,
        }],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ₵${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#4f6578", font: { family: "DM Sans", size: 11 } },
            grid:  { display: false },
          },
          y: {
            ticks: { color: "#4f6578", font: { family: "DM Sans", size: 11 } },
            grid:  { color: "rgba(28,45,69,0.8)" },
          },
        },
      },
    });
  }
}

/* ═══════════════════════════════════════════
   DEPOSIT
════════════════════════════════════════════ */
async function doDeposit() {
  const amount   = parseFloat(document.getElementById("depositAmount").value);
  const note     = document.getElementById("depositNote").value.trim();
  const category = document.getElementById("depositCategory").value;

  if (!amount || amount <= 0) return notify("Enter a valid amount", "error");

  const btn = document.getElementById("depositBtn");
  btn.disabled  = true;
  btn.innerHTML = `<span class="spinner"></span>Processing…`;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/deposit`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ amount, note, category }),
    });

    if (!res.ok) {
      const txt = await res.text();
      let msg = "Deposit failed";
      try { msg = JSON.parse(txt).error || msg; } catch {}
      return notify(msg, "error");
    }

    notify("Deposit successful 💰");
    closeSheet("depositOverlay");
    document.getElementById("depositAmount").value = "";
    document.getElementById("depositNote").value   = "";

    await loadUser();
    await loadTransactions();

  } catch (err) {
    console.error("❌ doDeposit", err);
    notify("Deposit failed", "error");
  } finally {
    btn.disabled  = false;
    btn.textContent = "Deposit";
  }
}

/* ═══════════════════════════════════════════
   TRANSFER
════════════════════════════════════════════ */
async function doTransfer() {
  const receiver = document.getElementById("transferReceiver").value.trim();
  const amount   = parseFloat(document.getElementById("transferAmount").value);
  const note     = document.getElementById("transferNote").value.trim();
  const category = document.getElementById("transferCategory").value;

  if (!receiver)          return notify("Enter recipient account number", "error");
  if (!amount || amount <= 0) return notify("Enter a valid amount", "error");

  const btn = document.getElementById("transferBtn");
  btn.disabled  = true;
  btn.innerHTML = `<span class="spinner"></span>Sending…`;

  try {
    const res = await fetch(`${BASE_URL}/api/transactions/transfer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ receiver, amount, note, category }),
    });

    if (!res.ok) {
      const txt = await res.text();
      let msg = "Transfer failed";
      try { msg = JSON.parse(txt).error || msg; } catch {}
      return notify(msg, "error");
    }

    notify("Transfer successful 💸");
    closeSheet("transferOverlay");
    document.getElementById("transferReceiver").value = "";
    document.getElementById("transferAmount").value   = "";
    document.getElementById("transferNote").value     = "";

    await loadUser();
    await loadTransactions();

  } catch (err) {
    console.error("❌ doTransfer", err);
    notify("Transfer failed", "error");
  } finally {
    btn.disabled  = false;
    btn.textContent = "Send Money";
  }
}

/* ═══════════════════════════════════════════
   FREEZE / UNFREEZE
════════════════════════════════════════════ */
async function toggleFreeze() {
  try {
    const res = await fetch(`${BASE_URL}/api/transactions/freeze`, {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return notify("Could not update account", "error");

    const data = await res.json();
    isFrozen = data.isFrozen;
    syncFreezeUI();
    notify(data.message, isFrozen ? "error" : "success");

  } catch (err) {
    notify("Could not update account", "error");
  }
}

/* ═══════════════════════════════════════════
   TRANSACTION LIMIT
════════════════════════════════════════════ */
function doSetLimit() {
  const limit = parseFloat(document.getElementById("limitAmount").value);
  if (!limit || limit <= 0) return notify("Enter a valid limit", "error");
  notify(`Limit saved — ₵${limit.toFixed(2)} per transaction`, "info");
  closeSheet("limitOverlay");
  // TODO: wire up PATCH /api/auth/limit when backend route is added
}

/* ═══════════════════════════════════════════
   BALANCE VISIBILITY
════════════════════════════════════════════ */
document.getElementById("eyeBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  balHidden = !balHidden;
  document.getElementById("balanceEl").classList.toggle("blurred", balHidden);
  this.textContent = balHidden ? "🙈" : "👁";
});

/* ═══════════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════════════ */
document.getElementById("themeBtn").addEventListener("click", function () {
  document.body.classList.toggle("light");
  this.textContent = document.body.classList.contains("light") ? "●" : "◐";
});

/* ═══════════════════════════════════════════
   LOGOUT
════════════════════════════════════════════ */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

/* ═══════════════════════════════════════════
   NOTIFICATIONS (placeholder)
════════════════════════════════════════════ */
document.getElementById("notifBtn").addEventListener("click", () =>
  notify("No new notifications", "info")
);

/* ═══════════════════════════════════════════
   SCROLL: HEADER BORDER
════════════════════════════════════════════ */
window.addEventListener("scroll", () => {
  document.getElementById("mainHeader")
    .classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

/* ═══════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
async function init() {
  await loadUser();
  await loadTransactions();

  // Hide loading screen
  const ls = document.getElementById("loadingScreen");
  ls.classList.add("fade-out");
  setTimeout(() => {
    ls.style.display = "none";
    document.getElementById("appContent").hidden = false;
  }, 400);
}

init();

// Refresh every 30s — free Render tier, don't hammer it
setInterval(() => {
  loadUser();
  loadTransactions();
}, 30_000);