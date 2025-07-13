// index.js
require("dotenv").config();
const express = require("express");
const app = express();
const { sequelize } = require("./models");
const path = require("path");
const { Message } = require("./models");

// ให้ Express เสิร์ฟไฟล์ static (HTML/JS/CSS)
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

//server
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server); // ← Socket.io server

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    await sequelize.sync(); // หรือ force: true ถ้าต้องการล้างแล้วสร้างใหม่
    console.log("✅ Models synced with database");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
});

const usersOnline = {};
// โครงสร้าง: { userId_or_username: [socketId1, socketId2, ...] }
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET; // อย่าลืมใส่ secret ใน .env
const disconnectTimers = {}; // เพิ่ม global timer storage
const lastDisconnectAt = {}; // เก็บ timestamp ของ disconnect ล่าสุด

io.on("connection", (socket) => {
  // โหลดแชทย้อนหลัง
  (async () => {
    const recentMessages = await Message.findAll({
      order: [["createdAt", "ASC"]],
      limit: 50,
    });
    socket.emit("chat history", recentMessages);
  })();

  
  socket.on("authenticate", (token) => {
    try {
      const payload = jwt.verify(token, SECRET); // ✅ decode JWT
      const username = payload.username;
      socket.username = username;

      if (disconnectTimers[username]) {
        clearTimeout(disconnectTimers[username]);
        delete disconnectTimers[username];
      }

      if (!usersOnline[username]) {
        usersOnline[username] = [];
      }
      usersOnline[username].push(socket.id);

      const now = Date.now();
      const recent =
        lastDisconnectAt[username] && now - lastDisconnectAt[username] < 3500;

      if (!recent) {
        // Broadcast ว่าเข้าห้อง ถ้าไม่ใช่ refresh ภายในไม่กี่วินาที
        io.emit("chat message", {
          system: true,
          message: `${username} เข้าร่วมการแชท`,
        });
      }

      // login ซ้ำ → เตะออก
      if (usersOnline[username].length > 1) {
        usersOnline[username].forEach((id) => {
          if (id !== socket.id) {
            io.to(id).emit(
              "force-logout",
              "Account logged in from another device"
            );
            io.sockets.sockets.get(id)?.disconnect(true);
          }
        });
      }

      io.emit("online users", Object.keys(usersOnline).length);
    } catch (err) {
      console.error("❌ JWT authentication failed:", err.message);
      socket.disconnect(true); // ตัดการเชื่อมต่อถ้า token ผิด
    }
  });

  // รับข้อความและ save DB
  socket.on("chat message", async (data) => {
    await Message.create({
      username: data.username,
      message: data.message,
      system: data.system || false,
    });
    io.emit("chat message", data);
  });


  socket.on("disconnect", () => {
    const username = socket.username;
    if (username && usersOnline[username]) {
      lastDisconnectAt[username] = Date.now(); // บันทึกเวลาที่หลุดล่าสุด
      // หน่วงเวลา 3 วินาที เพื่อดูว่า user เชื่อม socket ใหม่ไหม
      disconnectTimers[username] = setTimeout(() => {
        usersOnline[username] = usersOnline[username].filter(
          (id) => id !== socket.id
        );

        if (usersOnline[username].length === 0) {
          delete usersOnline[username];

          io.emit("chat message", {
            system: true,
            message: `${username} ออกจากการแชท`,
          });
        }

        io.emit("online users", Object.keys(usersOnline).length);
        delete disconnectTimers[username];
        delete lastDisconnectAt[username]; // ล้าง timestamp เมื่อออกจากระบบจริง
      }, 3000);
    }
  });
});
