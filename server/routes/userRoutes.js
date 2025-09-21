import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import User from "../models/user.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// -------------------- Cloudinary Multer Storage --------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatars", // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 250, height: 250, crop: "fill" }],
  },
});

const upload = multer({ storage });

// -------------------- GET Current User Profile --------------------
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------- UPDATE Profile Info --------------------
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------- UPLOAD / UPDATE AVATAR --------------------
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file || !req.file.path)
      return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    user.avatar = req.file.path; // Cloudinary URL
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------- UPDATE THEME --------------------
// -------------------- UPDATE THEME --------------------
router.put("/theme", protect, async (req, res) => {
  try {
    const { theme } = req.body;

    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.theme = theme;
    await user.save();

    res.json({ message: `Theme updated to ${theme}` });
  } catch (err) {
    console.error("Theme update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ✅ Export at the very end
export default router;
