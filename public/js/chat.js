// chat.js
import { getToken, parseJwt, requireLogin } from './utils.js';

// ตรวจสอบ JWT และดึงข้อมูลผู้ใช้
const payload = requireLogin();
const username = payload.username;
document.getElementById('username').textContent = username;

// Connect to socket.io
const socket = io();

// ส่งข้อมูล auth ให้ server
socket.emit('authenticate', getToken());

// DOM elements
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const onlineCountEl = document.getElementById('online-count');

// รับข้อความย้อนหลัง
socket.on("chat history", (messages) => {
  console.log("📜 ได้รับแชทย้อนหลัง:", messages);
  messages.forEach((msg) => {
    appendMessage(msg); // ต้องมีฟังก์ชันนี้แสดงข้อความใน chat box
  });
});

// แสดงข้อความแชทเมื่อมีคนส่งเข้ามา
socket.on('chat message', (data) => {
  const div = document.createElement('div');

  if (data.system) {
    div.style.fontStyle = 'italic';
    div.style.color = 'gray';
    div.textContent = `📢 ${data.message}`;
  } else {
    div.textContent = `${data.username || 'Anonymous'}: ${data.message}`;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});


// ส่งข้อความเมื่อกด submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = messageInput.value.trim();
  if (message !== '') {
    socket.emit('chat message', { username, message });
    messageInput.value = '';
  }
});

// อัปเดตจำนวนคนออนไลน์
socket.on('online users', (count) => {
  onlineCountEl.textContent = count;
});

// ถ้ามีคน login ซ้ำที่อื่น → บังคับ logout
socket.on('force-logout', (msg) => {
  alert(msg);
  localStorage.removeItem('token');
  window.location.href = '/index.html';
});

function appendMessage(msg) {
  const div = document.createElement("div");
  div.className = msg.system ? "system" : "user";
  div.textContent = msg.system
    ? `🔔 ${msg.message}`
    : `${msg.username}: ${msg.message}`;
  document.getElementById("chat-box").appendChild(div);
}