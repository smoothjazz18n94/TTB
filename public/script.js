const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = registerForm.name.value;
  const email = registerForm.email.value;
  const password = registerForm.password.value;

  try {
    const res = await fetch('https://bank-backend.onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    console.log(data); // <-- this will show exactly what the backend returned

    if (res.ok) {
      alert('Registration successful!');
    } else {
      alert('Registration failed: ' + data.message);
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Registration failed. Check console for details.');
  }
});