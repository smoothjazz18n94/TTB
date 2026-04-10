const BASE_URL = "https://bank-backend.onrender.com";

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (res.ok) {
      // Save token
      localStorage.setItem("token", data.token);

      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } else {
      showNotification(data.message || "Login failed");
    }
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    showNotification("Server error. Try again.");
  }
}

// 🔔 Notification (clean replacement for alert)
function showNotification(message) {
  const note = document.createElement("div");
  note.className = "notification";
  note.innerText = message;

  document.body.appendChild(note);

  setTimeout(() => {
    note.remove();
  }, 3000);
}