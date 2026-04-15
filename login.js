const BASE_URL = "https://ttb-x042.onrender.com";

    if (localStorage.getItem("token")) {
      window.location.href = "dashboard.html";
    }

    const btn = document.getElementById("loginBtn");
    const errorMsg = document.getElementById("errorMsg");

    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }

    function setLoading(loading) {
      btn.disabled = loading;
      btn.innerHTML = loading
        ? '<span class="spinner"></span>Signing in...'
        : "Sign in";
    }

    document.getElementById("password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });

    btn.addEventListener("click", login);

    async function login() {
      errorMsg.style.display = "none";
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) return showError("Please fill in all fields");

      setLoading(true);

      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const text = await res.text();
          let msg = "Login failed";
          try { msg = JSON.parse(text).error || msg; } catch {}
          return showError(msg);
        }

        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "dashboard.html";

      } catch (err) {
        showError("Could not connect to server. Try again.");
      } finally {
        setLoading(false);
      }
    }