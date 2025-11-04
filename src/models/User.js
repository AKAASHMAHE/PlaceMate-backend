// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String },
  resume: { type: String }, // stores Cloudinary URL

  // Role & Profile
  role: { type: String, default: "unassigned" },
  profileComplete: { type: Boolean, default: false },

  // Additional profile fields
  bio: { type: String },              // no limit
  skills: [{ type: String }],         // array of tags
  yearOfCompletion: { type: Number }, // graduation year
  companies: [{ type: String }],      // company names as tags
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
