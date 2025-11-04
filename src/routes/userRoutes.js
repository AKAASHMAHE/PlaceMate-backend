import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// ---------------------------
// ✅ Multer config
// ---------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------------
// ✅ Cloudinary config
// Make sure these are set in your .env:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// ---------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------
// GET /me - fetch logged-in user
// ---------------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------
// POST /profile-setup - update profile with optional resume upload
// ---------------------------
router.post(
  "/profile-setup",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const { role, skills, companies } = req.body;

      if (!role) return res.status(400).json({ message: "Role is required" });

      const updateData = {
        role,
        skills: skills ? JSON.parse(skills) : [],
        companies: companies ? JSON.parse(companies) : [],
        profileComplete: true,
      };

      // Handle resume upload to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "resumes" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        updateData.resumeUrl = result.secure_url; // Save Cloudinary URL
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
      res.json(user);
    } catch (err) {
      console.error("Error in profile setup:", err);
      res.status(500).json({ message: "Failed to save profile" });
    }
  }
);
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id name role skills companies picture");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
