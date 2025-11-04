import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload helper
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "resumes",
        public_id: `resume_${uuidv4()}`,
        resource_type: "auto",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ✅ Profile Setup + Update
router.post(
  "/profile-setup",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Extract data safely
      let { role, skills, companies } = req.body;

      // 🔍 Handle stringified JSON or plain text
      if (typeof skills === "string") {
        try {
          skills = JSON.parse(skills);
        } catch {
          skills = [skills];
        }
      }
      if (typeof companies === "string") {
        try {
          companies = JSON.parse(companies);
        } catch {
          companies = [companies];
        }
      }

      // ✅ Assign fields
      if (role) user.role = role;
      if (skills?.length) user.skills = skills;
      if (companies?.length) user.companies = companies;

      // ✅ Resume upload
      if (req.file) {
        console.log("📤 Uploading resume...");
        const result = await uploadToCloudinary(req.file.buffer);
        console.log("✅ Resume uploaded:", result.secure_url);
        user.resume = result.secure_url;
      }

      await user.save();

      return res.json({
        message: "✅ Profile updated successfully",
        user,
      });
    } catch (err) {
      console.error("❌ Profile setup error:", err);
      return res
        .status(500)
        .json({ message: err.message || "Server error while updating profile" });
    }
  }
);

export default router;