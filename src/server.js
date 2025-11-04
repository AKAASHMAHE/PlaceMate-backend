// ========================
// server.js - PlaceMate Backend
// ========================

import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import http from "http";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Server } from "socket.io";

// Models & Routes
import User from "./models/User.js";
import Message from "./models/Message.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import chatbotRoutes from "./routes/chatbot.js";
import forumRoutes from "./routes/forumRoutes.js";

import jobsRoutes from "./routes/jobRoutes.js";
dotenv.config();
console.log("✅ ENV Check:", process.env.MONGO_URI ? "Loaded" : "Not Loaded");

const app = express();

// ========================
// Middleware
// ========================
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ========================
// Routes
// ========================
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/forum", forumRoutes);

app.use("api/profile",profileRoutes);
app.use("/api/jobs", jobsRoutes);

// ========================
// MongoDB Connection
// ========================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ========================
// Google OAuth Client
// ========================
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// JWT Generator
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ========================
// Test Route
// ========================
app.get("/", (req, res) => res.send("🚀 PlaceMate backend is running!"));

// ========================
// Google OAuth Routes
// ========================
app.get("/auth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(500).send("❌ Google OAuth not configured correctly.");
  }

  const oauthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    "&response_type=code&scope=email%20profile";

  res.redirect(oauthUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("❌ No code provided by Google.");

    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    client.setCredentials(tokens);

    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const { id, email, name, picture } = response.data;

    if (process.env.ALLOWED_DOMAIN && !email.endsWith("@" + process.env.ALLOWED_DOMAIN)) {
      return res.redirect("http://localhost:3000/invalid-login");
    }

    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      user = await User.create({ googleId: id, name, email, picture });
      isNewUser = true;
    }

    const token = generateToken(user);

    if (isNewUser || !user.profileComplete) {
      res.redirect(`http://localhost:3000/profile-setup?token=${token}`);
    } else {
      res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    }
  } catch (err) {
    console.error("❌ OAuth Error:", err.response?.data || err.message || err);
    res.status(500).send("Authentication failed");
  }
});

// ========================
// Global Error Handler
// ========================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// ========================
// Socket.IO Messaging
// ========================
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ New socket connection:", socket.id);

  // Track online users
  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("User online:", userId);
  });

  // Optional: join a private room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Send message
 // ========================
// FIXED Socket Message Handling ✅
// ========================
socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
  try {
    // Save message to DB
    const msg = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Emit only to the receiver — NOT the sender
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", msg);
    }

    console.log("✅ Message delivered:", msg.content);
  } catch (err) {
    console.error("❌ Socket sendMessage error:", err);
  }
});

  // Disconnect
  socket.on("disconnect", () => {
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) onlineUsers.delete(userId);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
