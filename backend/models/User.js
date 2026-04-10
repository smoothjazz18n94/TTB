const BASE_URL = "https://ttb-x042.onrender.com";

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ get elements FIRST
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // ❗ safety check
  if (!nameInput || !emailInput || !passwordInput) {
    console.error("Input fields not found");
    alert("Form error: check input IDs");
    return;
  }

  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

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
      alert("Registration successful 🎉");
      window.location.href = "login.html";
    } else {
      alert(data.message || "Registration failed");
    }

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    alert("Server error");
  }
});