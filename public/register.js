console.log("JS LOADED");

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = registerForm.name.value;
  const email = registerForm.email.value;
  const password = registerForm.password.value;

  try {
    const res = await fetch("https://bank-backend.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    // 🔍 Debug logs
  console.log("STATUS:", res.status);
console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

    if (res.ok) {
      message.style.color = "green";
      message.textContent = "✅ Registration successful!";
      registerForm.reset();
    } else {
      message.style.color = "red";
      message.textContent =
        data.error ||
        (data.errors && data.errors[0].msg) ||
        "Registration failed";
 alert("ERROR: " + JSON.stringify(data, null, 2)); // 🔥 shows real backend error
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);

    message.style.color = "red";
    message.textContent = "❌ Cannot connect to server";

    alert("FETCH ERROR: " + err.message);
  }
});