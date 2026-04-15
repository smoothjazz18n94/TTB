const BASE_URL = "https://ttb-x042.onrender.com";

if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

const form = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

function showError(msg) {
  errorMsg.textContent = msg;
  successMsg.textContent = "";
}

function showSuccess(msg) {
  successMsg.textContent = msg;
  errorMsg.textContent = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) return showError("Fill all fields");






  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) return showError(data.error || "Failed");

    showSuccess("Account created! Redirecting...");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    showError("Server error");
  }
});

