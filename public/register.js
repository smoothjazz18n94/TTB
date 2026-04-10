const BASE_URL = "https://ttb-x042.onrender.com";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    console.log("REGISTER:", data);

    if (res.ok) {
      document.getElementById("registerMessage").textContent =
        "Registration successful 🎉";

      // redirect after short delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } else {
      document.getElementById("registerMessage").textContent =
        data.message || "Registration failed";
    }

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    document.getElementById("registerMessage").textContent =
      "Server error";
  }
});