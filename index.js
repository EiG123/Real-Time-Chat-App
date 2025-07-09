// index.js
require("dotenv").config();
const express = require("express");
const app = express();
const { sequelize } = require("./models");
const path = require("path");

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
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
});

const usersOnline = {};
// โครงสร้าง: { userId_or_username: [socketId1, socketId2, ...] }

io.on("connection", (socket) => {
  socket.on("authenticate", (username) => {
    socket.username = username;

    if (!usersOnline[username]) {
      usersOnline[username] = [];
    }

    usersOnline[username].push(socket.id);

    // Broadcast ว่าเข้าห้อง
    io.emit("chat message", {
      system: true,
      message: `${username} เข้าร่วมการแชท`,
    });

    // login ซ้ำ → เตะออก
    if (usersOnline[username].length > 1) {
      usersOnline[username].forEach((id) => {
        if (id !== socket.id) {
          io.to(id).emit(
            "force-logout",
            "Account logged in from another device"
          );
          io.sockets.sockets.get(id).disconnect(true);
        }
      });
    }

    io.emit("online users", Object.keys(usersOnline).length);
  });

  socket.on("chat message", (data) => {
    console.log("📨 รับข้อความจาก client:", data);
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    const username = socket.username;
    if (username && usersOnline[username]) {
      usersOnline[username] = usersOnline[username].filter(
        (id) => id !== socket.id
      );
      if (usersOnline[username].length === 0) {
        delete usersOnline[username];

        // Broadcast ว่าออกจากห้อง
        io.emit("chat message", {
          system: true,
          message: `${username} ออกจากการแชท`,
        });
      }
      io.emit("online users", Object.keys(usersOnline).length);
    }
  });
});
