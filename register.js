 const BASE_URL = "https://ttb-x042.onrender.com";

    if (localStorage.getItem("token")) {
      window.location.href = "dashboard.html";
    }

    const btn = document.getElementById("registerBtn");
    const errorMsg = document.getElementById("errorMsg");
    const successMsg = document.getElementById("successMsg");

    document.getElementById("password").addEventListener("input", function () {
      const val = this.value;
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
      btn.disabled = loading;
      btn.innerHTML = loading
        ? '<span class="spinner"></span>Creating account...'
        : "Create account";
    }

    btn.addEventListener("click", register);

    async function register() {
      errorMsg.style.display = "none";
      successMsg.style.display = "none";

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!name || !email || !password) return showError("Please fill in all fields");
      if (password.length < 6) return showError("Password must be at least 6 characters");

      setLoading(true);

      try {
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const text = await res.text();
          let msg = "Registration failed";
          try { msg = JSON.parse(text).error || msg; } catch {}
          return showError(msg);
        }

        const data = await res.json();
        showSuccess("Account created! Redirecting to login...");

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);

      } catch (err) {
        showError("Could not connect to server. Try again.");
      } finally {
        setLoading(false);
      }
    }