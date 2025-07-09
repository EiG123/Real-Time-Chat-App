document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (res.ok) {
    alert('Register success!');
    window.location.href = '/login.html'; // ไปหน้า login
  } else {
    alert(data.message || 'Register failed');
  }
});
