// chat.js
import { getToken, parseJwt, requireLogin } from "./utils.js";

// ตรวจสอบ JWT และดึงข้อมูลผู้ใช้
const payload = requireLogin();
const username = payload.username;
document.getElementById("username").textContent = username;

// Connect to socket.io
const socket = io();

// ส่งข้อมูล auth ให้ server
socket.emit("authenticate", getToken());

// DOM elements
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const onlineCountEl = document.getElementById("online-count");

// ตัวแปรสำหรับ typing
let typingTimeout;
let isTyping = false;

// Test connection
socket.on("connect", () => {
  console.log("✅ Connected to server");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

// รับข้อความย้อนหลัง
socket.on("chat history", (messages) => {
  console.log("📜 Chat history received:", messages.length, "messages");
  messages.forEach((msg) => {
    appendMessage(msg);
  });
});

// แสดงข้อความแชทเมื่อมีคนส่งเข้ามา
socket.on("chat message", (data) => {
  console.log("💬 New chat message:", data);
  const div = document.createElement("div");

  if (data.system) {
    div.style.fontStyle = "italic";
    div.style.color = "gray";
    div.textContent = `📢 ${data.message}`;
  } else {
    div.textContent = `${data.username || "Anonymous"}: ${data.message}`;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ส่งข้อความเมื่อกด submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = messageInput.value.trim();
  if (message !== "") {
    console.log("📤 Sending message:", message);
    
    // หยุด typing เมื่อส่งข้อความ
    if (isTyping) {
      console.log("⏹️ Stopping typing before sending message");
      socket.emit("stop typing");
      isTyping = false;
    }
    
    socket.emit("chat message", { username, message });
    messageInput.value = "";
  }
});

// อัปเดตจำนวนคนออนไลน์
socket.on("online users", (count) => {
  console.log("👥 Online users:", count);
  onlineCountEl.textContent = count;
});

// ถ้ามีคน login ซ้ำที่อื่น → บังคับ logout
socket.on("force-logout", (msg) => {
  alert(msg);
  localStorage.removeItem("token");
  window.location.href = "/index.html";
});

function appendMessage(msg) {
  const div = document.createElement("div");
  div.className = msg.system ? "system" : "user";
  div.textContent = msg.system
    ? `🔔 ${msg.message}`
    : `${msg.username}: ${msg.message}`;
  document.getElementById("chat-box").appendChild(div);
}

// รอให้ DOM โหลดเสร็จก่อน
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 DOM loaded, setting up typing events");
  
  // ตรวจสอบว่า elements มีอยู่จริง
  const messageInput = document.getElementById("message");
  const typingDiv = document.getElementById("typing-indicator");
  
  if (!messageInput) {
    console.error("❌ Message input not found!");
    return;
  }
  
  if (!typingDiv) {
    console.error("❌ Typing indicator not found!");
    // สร้าง element ถ้าไม่มี
    const newTypingDiv = document.createElement("div");
    newTypingDiv.id = "typing-indicator";
    newTypingDiv.style.display = "none";
    newTypingDiv.style.color = "#666";
    newTypingDiv.style.fontStyle = "italic";
    newTypingDiv.style.margin = "5px 0";
    
    // เพิ่มก่อน chat-box
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.parentNode.insertBefore(newTypingDiv, chatBox);
      console.log("✅ Created typing indicator element");
    }
  }

  // Typing functionality
  messageInput.addEventListener("input", (e) => {
    const value = e.target.value.trim();
    console.log("⌨️ Input event:", value.length, "characters");
    
    if (value.length > 0) {
      // ส่ง typing event เฉพาะเมื่อยังไม่ได้ส่ง
      if (!isTyping) {
        console.log("🔄 Sending typing event");
        socket.emit("typing");
        isTyping = true;
      }

      // Clear timeout เดิมและตั้งใหม่
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        console.log("⏹️ Typing timeout - stopping typing");
        socket.emit("stop typing");
        isTyping = false;
      }, 1500);
    } else {
      // ถ้าลบข้อความหมดแล้ว หยุด typing
      if (isTyping) {
        console.log("⏹️ Input cleared - stopping typing");
        socket.emit("stop typing");
        isTyping = false;
        clearTimeout(typingTimeout);
      }
    }
  });

  // หยุด typing เมื่อ input ว่าง
  messageInput.addEventListener("blur", () => {
    console.log("👁️ Input blur event");
    if (isTyping) {
      console.log("⏹️ Stopping typing on blur");
      socket.emit("stop typing");
      isTyping = false;
      clearTimeout(typingTimeout);
    }
  });

  // หยุด typing เมื่อกด Enter
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      console.log("⏹️ Enter pressed - stopping typing");
      if (isTyping) {
        socket.emit("stop typing");
        isTyping = false;
        clearTimeout(typingTimeout);
      }
    }
  });
});

// แสดงผู้ใช้ที่กำลังพิมพ์
socket.on("typing", (usersTyping) => {
  console.log("👀 Typing event received:", usersTyping);
  
  const typingDiv = document.getElementById("typing-indicator");
  
  if (!typingDiv) {
    console.error("❌ typing-indicator element not found when trying to show typing");
    return;
  }

  if (usersTyping.length === 0) {
    console.log("📝 No one is typing");
    typingDiv.textContent = "";
    typingDiv.style.display = "none";
  } else if (usersTyping.length === 1) {
    console.log("📝 One person typing:", usersTyping[0]);
    typingDiv.textContent = `${usersTyping[0]} กำลังพิมพ์...`;
    typingDiv.style.display = "block";
  } else {
    console.log("📝 Multiple people typing:", usersTyping);
    typingDiv.textContent = `${usersTyping.join(", ")} กำลังพิมพ์...`;
    typingDiv.style.display = "block";
  }
});

// Cleanup เมื่อ disconnect
socket.on("disconnect", () => {
  console.log("🔌 Socket disconnected - cleaning up");
  if (isTyping) {
    isTyping = false;
    clearTimeout(typingTimeout);
  }
});