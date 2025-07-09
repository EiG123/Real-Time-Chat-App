// ดึง token จาก localStorage
export function getToken() {
  return sessionStorage.getItem('token');
}

// decode JWT เพื่อดู payload (ไม่ใช้ lib ภายนอก)
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

// ตรวจว่า login อยู่ไหม ถ้าไม่ให้ redirect
export function requireLogin() {
  const token = getToken();
  const payload = token ? parseJwt(token) : null;

  if (!payload || !payload.username) {
    alert('Please login first');
    window.location.href = '/login.html';
  }

  return payload;
}
