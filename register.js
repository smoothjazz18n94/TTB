console.log("REGISTER JS LOADED");

const BASE_URL = "https://ttb-x042.onrender.com";

// ======================
// REDIRECT IF LOGGED IN
// ======================
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

// ======================
// ELEMENTS
// ======================
const form = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ======================
// PASSWORD STRENGTH
// ======================
passwordInput.addEventListener("input", () => {
  const val = passwordInput.value;
  const fill = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");

  let strength = 0;

  if (val.length >= 6) strength++;
  if (val.length >= 10) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^a-zA-Z0-9]/.test(val)) strength++;

  const map = [
    { w: "0%", bg: "#1e293b", text: "At least 6 characters" },
    { w: "25%", bg: "#ef4444", text: "Weak" },
    { w: "50%", bg: "#f97316", text: "Fair" },
    { w: "75%", bg: "#eab308", text: "Good" },
    { w: "100%", bg: "#22c55e", text: "Strong" },
  ];

  const s = Math.min(strength, 4);
  fill.style.width = map[s].w;
  fill.style.background = map[s].bg;
  label.textContent = val.length === 0 ? "At least 6 characters" : map[s].text;
});

// ======================
// UI HELPERS
// ======================
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
  successMsg.style.display = "none";
}

function showSuccess(msg) {
  successMsg.textContent = msg;
  successMsg.style.display = "block";
  errorMsg.style.display = "none";
}

function setLoading(loading) {
  const btn = form.querySelector("button");

  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner"></span>Creating account...'
    : "Create account";
}

// ======================
// FORM SUBMIT (IMPORTANT FIX)
// ======================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!name || !email || !password) {
    return showError("Please fill in all fields");
  }

  if (password.length < 6) {
    return showError("Password must be at least 6 characters");
  }

  setLoading(true);

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      return showError(data.error || "Registration failed");
    }

    showSuccess("Account created! Redirecting...");

    // OPTIONAL: auto-login
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    showError("Could not connect to server");
  } finally {
    setLoading(false);
  }
});