const BASE_URL = "https://ttb-x042.onrender.com";

console.log("LOGIN JS LOADED");

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("LOGIN SUBMITTED");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("LOGIN DATA:", { email, password });

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
      localStorage.setItem("token", data.token);

      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Login failed");
    }

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    alert("Server error");
  }
});