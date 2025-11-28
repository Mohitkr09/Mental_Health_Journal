import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleTheme,
  getMindMap,
  saveMindMap,
  shareCommunityPost,
  getCommunityPosts,
  reactCommunityPost,
  editCommunityPost,
  deleteCommunityPost,
  getMoodEntries,
  voiceTranscribe,
  chatHandler,
} from "../controllers/AuthController.js";

import { protect } from "../middleware/authmiddleware.js";
import parser from "../middleware/upload.js";
import audioUpload from "../middleware/uploadAudio.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* ==================== AUTH ==================== */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ==================== USER PROFILE ==================== */
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/theme", protect, toggleTheme);

/* ==================== AVATAR UPLOAD ==================== */
router.post("/avatar", protect, parser.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete old avatar if exists
    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (delErr) {
        console.warn("⚠️ Failed to delete old avatar:", delErr.message);
      }
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("❌ Avatar upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ==================== MIND MAP ==================== */
router.get("/mindmap", protect, getMindMap);
router.post("/mindmap", protect, saveMindMap);

/* ==================== MOOD ENTRIES ==================== */
router.get("/mood-entries", protect, getMoodEntries);

/* ==================== COMMUNITY POSTS ==================== */
router.post("/community/share", protect, shareCommunityPost);
router.get("/community/posts", protect, getCommunityPosts);
router.post("/community/react", protect, reactCommunityPost);
router.put("/community/posts/:id", protect, editCommunityPost);
router.delete("/community/posts/:id", protect, deleteCommunityPost);

/* ==================== VOICE TRANSCRIBE ==================== */
// 🎙 FRONTEND → formData.append("file", blob)
// 🚀 BACKEND MUST USE .single("file")
/* ==================== VOICE TRANSCRIBE ==================== */
router.post(
  "/voice-transcribe",
  protect,
  audioUpload.single("audio"),   // ✅ FINAL FIX — match multer + frontend
  voiceTranscribe
);


/* ==================== AI CHAT ==================== */
router.post("/chat", protect, chatHandler);

export default router;
