const BASE_URL = "https://ttb-x042.onrender.com";

// wait until page fully loads
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // get values safely
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("FORM VALUES:", { name, email, password });

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      console.log("REGISTER RESPONSE:", data);

      if (res.ok) {
        document.getElementById("registerMessage").textContent =
          "Registration successful 🎉";

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

});