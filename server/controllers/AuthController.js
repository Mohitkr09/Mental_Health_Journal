import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { execSync, spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";

import User from "../models/user.js";
import MindMap from "../models/mindMap.js";
import CommunityPost from "../models/CommunityPost.js";
import transporter from "../utils/email.js";



// ---------------- JWT ----------------
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ---------------- REGISTER ----------------
// ---------------- REGISTER USER (FINAL UPDATED CODE) ----------------
export const registerUser = async (req, res) => {
  try {
    console.log("📨 Register request:", req.body);

    const { name, email, password, avatar, theme } = req.body;

    // 🛑 Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // 🔎 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("⚠️ Email already registered:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // 🏗 Create new user and hash password using .save()
    const user = new User({
      name,
      email,
      password, // raw password — will be hashed by pre('save') middleware
      avatar: avatar || "",
      theme: ["light", "dark", "system"].includes(theme) ? theme : "light",
    });

    await user.save(); // 🔐 ensures password hashing occurs

    console.log("✅ User created:", user._id.toString());

    // 📧 Send Welcome Email (non-blocking, optional)
    if (process.env.EMAIL_USER && transporter) {
      transporter
        .sendMail({
          from: `"MindCare" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "🎉 Welcome to MindCare!",
          html: `
            <h2>Hello ${user.name},</h2>
            <p>Welcome to <strong>MindCare</strong> 🌱</p>
            <p>Your wellness journey just began!</p>
            <a href="${process.env.CLIENT_URL || ""}/login"
              style="padding:10px 18px;background:#6D28D9;color:#fff;
              border-radius:8px;text-decoration:none;font-size:14px;">
              Login Now
            </a>
            <br/><br/>
            <small style="color:gray;">
              If you didn’t create this account, you may safely ignore this email.
            </small>
          `,
        })
        .then(() => console.log("📨 Welcome email sent to:", user.email))
        .catch((err) => console.warn("⚠️ Email send error:", err.message));
    } else {
      console.log("📭 Skipping welcome email — EMAIL_USER not configured");
    }

    // 🎫 Return response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      theme: user.theme,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("❌ REGISTER CRASH:", error.message);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};



export const loginUser = async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      theme: user.theme,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server crash", error: error.message });
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

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.theme = req.body.theme || user.theme;

    // ✅ CLOUDINARY IMAGE URL
    if (req.file?.path) {
      user.avatar = req.file.path;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

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
    res.status(500).json({ message: "Server error" });
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

// ---------------- MIND MAP ----------------
export const getMindMap = async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({ user: req.user._id });
    if (!mindMap) return res.status(200).json({ nodes: [], edges: [] });
    res.json(mindMap);
  } catch (error) {
    console.error("❌ Get Mind Map error:", error);
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
    console.error("❌ Save Mind Map error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- COMMUNITY POSTS ----------------
const filterSensitiveData = (text) => {
  const patterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    /\b\d{10}\b/g,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
  ];
  let cleanText = text;
  patterns.forEach((p) => (cleanText = cleanText.replace(p, "[REDACTED]")));
  return cleanText;
};

export const shareCommunityPost = async (req, res) => {
  try {
    const { text, mood } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const post = await CommunityPost.create({
      user: req.user._id, // ✅ ADD USER
      text: filterSensitiveData(text),
      mood: mood || "neutral",
      likes: { support: 0, relate: 0 },
      anonymous_id: uuidv4(),
    });

    // ✅ Populate user before sending response
    const populatedPost = await post.populate("user", "name avatar");

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("❌ Share post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getCommunityPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find({})
      .populate("user", "name avatar") // ✅ IMPORTANT
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error("❌ Get posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const reactCommunityPost = async (req, res) => {
  try {
    const { postId, type } = req.body;
    const field =
      type === "support" ? "likes.support" : type === "relate" ? "likes.relate" : null;
    if (!field) return res.status(400).json({ message: "Invalid reaction type" });

    await CommunityPost.findByIdAndUpdate(postId, { $inc: { [field]: 1 } });
    res.json({ success: true, type });
  } catch (error) {
    console.error("❌ React post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const editCommunityPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.text = filterSensitiveData(text);
    await post.save();
    res.json(post);
  } catch (error) {
    console.error("❌ Edit post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCommunityPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully", postId: id });
  } catch (error) {
    console.error("❌ Delete post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const voiceTranscribe = async (req, res) => {
  try {
    // 1️⃣ Validate file
    if (!req.file) {
      console.error("❌ No audio file received");
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log("🎤 Audio received:", {
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // 2️⃣ Temp paths (Render-safe)
    const tempDir = os.tmpdir();
    const tempWebm = path.join(tempDir, `audio-${Date.now()}.webm`);
    const tempWav = path.join(tempDir, `audio-${Date.now()}.wav`);

    // 3️⃣ Write audio file
    if (req.file.buffer) {
      fs.writeFileSync(tempWebm, req.file.buffer);
    } else if (req.file.path) {
      fs.copyFileSync(req.file.path, tempWebm);
    } else {
      return res.status(400).json({ error: "Invalid audio upload" });
    }

    // 4️⃣ Convert audio using system FFmpeg
    try {
      execSync(
  `"${ffmpegPath}" -y -i "${tempWebm}" -ar 16000 -ac 1 -c:a pcm_s16le "${tempWav}"`,
  { stdio: "inherit" }
);

      console.log("✅ FFmpeg conversion success");
    } catch (err) {
      console.error("❌ FFmpeg failed:", err.message);
      return res.status(500).json({ error: "Audio conversion failed" });
    }

    // 5️⃣ Python transcription
    const pythonScript = path.join(process.cwd(), "python", "transcribe.py");

    console.log("🐍 Running Python:", pythonScript);

    const result = spawnSync("python3", [pythonScript, tempWav], {
      encoding: "utf-8",
    });

    console.log("🐍 STDOUT:", result.stdout);
    console.error("🐍 STDERR:", result.stderr);

    // 6️⃣ Handle Python failure
    if (result.status !== 0) {
      return res.status(500).json({
        error: "Transcription failed",
        details: result.stderr || "Python script error",
      });
    }

    // 7️⃣ Cleanup
    fs.unlinkSync(tempWebm);
    fs.unlinkSync(tempWav);

    // 8️⃣ Return text
    const text = result.stdout.trim();
    res.json({ text: text || "No speech detected" });

  } catch (error) {
    console.error("🔥 Voice Transcription Crash:", error);
    res.status(500).json({
      error: "Voice transcription failed",
      details: error.message,
    });
  }
};



// ---------------- CHAT (Python AI) ----------------
export const chatHandler = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    console.log("💬 Incoming message:", message);

    // 🧠 Run local Python AI script
    const pythonPath = path.join(process.cwd(), "server", "python", "chat.py");
    const result = spawnSync("python", [pythonPath, message], { encoding: "utf-8" });

    if (result.error) {
      console.error("❌ Python AI Error:", result.error.message);
      return res.status(500).json({
        reply: "Python AI failed to respond.",
        error: result.error.message,
      });
    }

    const aiReply = result.stdout.trim() || "No response from Python AI.";
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({
      reply: "AI service unavailable. Please try later.",
      error: err.message,
    });
  }
};

// ---------------- MOOD ENTRIES ----------------
export const getMoodEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mood } = req.query;
    const query = { user: userId };
    if (mood && mood !== "all") query.mood = mood;

    const entries = await MindMap.find(query).sort({ date: 1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error("❌ Get mood entries error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
