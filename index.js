// index.js
require('dotenv').config();
const express = require('express');
const app = express();
const { sequelize } = require('./models');
const path = require('path');

// ให้ Express เสิร์ฟไฟล์ static (HTML/JS/CSS)
app.use(express.static(path.join(__dirname, 'public')));


// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

//server
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server); // ← Socket.io server

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
});

// เมื่อมี client เชื่อมต่อ socket
io.on('connection', (socket) => {
  console.log('User connected');

  // รับข้อความแล้ว broadcast ไปทุกคน
  socket.on('chat message', (data) => {
    io.emit('chat message', data); // ส่งให้ทุก client
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
