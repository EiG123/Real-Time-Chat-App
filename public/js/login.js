document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token); // เก็บ JWT
    alert('Login success!');
    window.location.href = '/chat.html'; // ไปหน้าแชท (ยังไม่ทำ)
  } else {
    alert(data.message || 'Login failed');
  }
});
