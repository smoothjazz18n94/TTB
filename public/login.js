const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      loginMessage.style.color = 'green';
      if (res.ok) {
  // Save token
  localStorage.setItem("token", data.token);

  // Redirect to dashboard
  window.location.href = "dashboard.html";
}
      
      // Save token if you want to use it for protected routes
      localStorage.setItem('token', data.token);
      loginForm.reset();
    } else {
      loginMessage.style.color = 'red';
      loginMessage.textContent = data.error || (data.errors && data.errors[0].msg) || 'Login failed';
    }
  } catch (err) {
    console.error('Error:', err);
    loginMessage.style.color = 'red';
    loginMessage.textContent = 'Login failed. Check console.';
  }
});