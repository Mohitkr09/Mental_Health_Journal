import User from "../models/user.js";
import MindMap from "../models/mindMap.js";
import CommunityPost from "../models/CommunityPost.js"; // ✅ New model for community posts
import jwt from "jsonwebtoken";
import transporter from "../utils/email.js";
import { v4 as uuidv4 } from "uuid";

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ---------------- REGISTER ----------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, theme } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      avatar: avatar || "",
      theme: theme && ["light", "dark", "system"].includes(theme) ? theme : "light",
    });

    // Send Welcome Email
    try {
      await transporter.sendMail({
        from: `"MindCare" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "🎉 Welcome to MindCare!",
        html: `
          <h2>Hi ${user.name},</h2>
          <p>Welcome to <b>MindCare</b> ✨</p>
          <p>Start journaling today and track your mood daily.</p>
          <br/>
          <a href="${process.env.CLIENT_URL}/login" 
             style="padding:10px 20px;background:#6D28D9;color:#fff;text-decoration:none;border-radius:6px;">
            Login Now
          </a>
          <p style="margin-top:20px;color:gray;font-size:12px;">
            If you didn’t sign up for MindCare, ignore this email.
          </p>
        `,
      });
      console.log(`📧 Welcome email sent to ${user.email}`);
    } catch (mailErr) {
      console.error("❌ Email send error:", mailErr.message);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      theme: user.theme,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- LOGIN ----------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      theme: user.theme,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- PROFILE ----------------
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    user.theme = req.body.theme || user.theme;
    if (req.body.password) user.password = req.body.password;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      theme: updatedUser.theme,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- TOGGLE THEME ----------------
export const toggleTheme = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.theme = user.theme === "light" ? "dark" : "light";
    await user.save();

    res.json({ message: "Theme updated", theme: user.theme });
  } catch (error) {
    console.error("❌ Toggle theme error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- MIND MAP CONTROLLERS ----------------
export const getMindMap = async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({ user: req.user._id });
    if (!mindMap) return res.status(200).json({ nodes: [], edges: [] });
    res.json(mindMap);
  } catch (error) {
    console.error("❌ Get Mind Map error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const saveMindMap = async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    let mindMap = await MindMap.findOne({ user: req.user._id });

    if (mindMap) {
      mindMap.nodes = nodes;
      mindMap.edges = edges;
      await mindMap.save();
    } else {
      mindMap = await MindMap.create({ user: req.user._id, nodes, edges });
    }

    res.status(200).json({ message: "Mind Map saved successfully", mindMap });
  } catch (error) {
    console.error("❌ Save Mind Map error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- COMMUNITY SHARING ----------------

// Filter sensitive data
const filterSensitiveData = (text) => {
  const patterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,  // Names
    /\b\d{10}\b/g,                   // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi // Emails
  ];
  let cleanText = text;
  patterns.forEach((p) => { cleanText = cleanText.replace(p, "[REDACTED]"); });
  return cleanText;
};

// Share anonymously
export const shareCommunityPost = async (req, res) => {
  try {
    const { text, mood } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const post = await CommunityPost.create({
      text: filterSensitiveData(text),
      mood: mood || "neutral",
      date: new Date(),
      likes: 0,
      relations: 0,
      anonymous_id: uuidv4(),
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("❌ Share post error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch latest community posts
export const getCommunityPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find({})
      .sort({ date: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    console.error("❌ Get posts error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// React to a post
export const reactCommunityPost = async (req, res) => {
  try {
    const { postId, type } = req.body;
    const updateField = type === "like" ? { likes: 1 } : { relations: 1 };

    await CommunityPost.findByIdAndUpdate(postId, { $inc: updateField });
    res.json({ success: true });
  } catch (error) {
    console.error("❌ React post error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
