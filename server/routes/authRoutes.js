import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleTheme,
  getMindMap,     
  saveMindMap,    // ✅ Mind Map controller
  shareCommunityPost,   // ✅ Community feature
  getCommunityPosts,    // ✅ Community feature
  reactCommunityPost    // ✅ Community feature
} from "../controllers/AuthController.js";
import { protect } from "../middleware/authmiddleware.js";
import parser from "../middleware/upload.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ==================== AUTH ====================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ==================== USER PROFILE ====================
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/theme", protect, toggleTheme);

// ==================== AVATAR UPLOAD ====================
router.post("/avatar", protect, parser.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (delErr) {
        console.warn("⚠️ Failed to delete old avatar:", delErr.message);
      }
    }

    // Save new avatar
    user.avatar = req.file.path;
    await user.save();

    res.json({ message: "Avatar uploaded successfully", avatar: user.avatar });
  } catch (err) {
    console.error("❌ Avatar upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== MIND MAP ====================
router.get("/mindmap", protect, getMindMap);   // ✅ get Mind Map
router.post("/mindmap", protect, saveMindMap); // ✅ save/update Mind Map

// ==================== COMMUNITY SHARING ====================
router.post("/community/share", protect, shareCommunityPost); // Share anonymously
router.get("/community/posts", protect, getCommunityPosts);   // Fetch community posts
router.post("/community/react", protect, reactCommunityPost); // React 💬 / ❤️

export default router;
