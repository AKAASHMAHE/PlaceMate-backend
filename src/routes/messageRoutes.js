import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

const router = express.Router();

// GET all registered users except the logged-in user
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "name role skills companies picture"
    );
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET messages between logged-in user and another user
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST a new message
router.post("/", authMiddleware, async (req, res) => {
  try {
    const sender = req.user._id;
    const { receiver, content } = req.body;

    const newMessage = await Message.create({ sender, receiver, content });
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ Failed to send message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
