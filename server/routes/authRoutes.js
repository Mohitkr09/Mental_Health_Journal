import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleTheme,   // ✅ import toggle theme
} from "../controllers/AuthController.js";
import { protect } from "../middleware/authmiddleware.js";
import parser from "../middleware/upload.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ==================== AUTH ====================
router.post("/register", registerUser);   // ✅ Register + Send welcome email
router.post("/login", loginUser);

// ==================== USER PROFILE ====================
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/theme", protect, toggleTheme); // ✅ toggle theme route

// ==================== AVATAR UPLOAD ====================
router.post("/avatar", protect, parser.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);

    // ✅ delete old avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (delErr) {
        console.warn("⚠️ Failed to delete old avatar:", delErr.message);
      }
    }

    // ✅ save new avatar
    user.avatar = req.file.path;
    await user.save();

    res.json({ message: "Avatar uploaded successfully", avatar: user.avatar });
  } catch (err) {
    console.error("❌ Avatar upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
