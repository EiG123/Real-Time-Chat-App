const socket = io(); // connect to server

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');

// รับข้อความจาก server
socket.on('chat message', (data) => {
  const div = document.createElement('div');
  div.textContent = `${data.username || 'Anonymous'}: ${data.message}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ส่งข้อความไปยัง server
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg !== '') {
    socket.emit('chat message', { message: msg });
    messageInput.value = '';
  }
});
