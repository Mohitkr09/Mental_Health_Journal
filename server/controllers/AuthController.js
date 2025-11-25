import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { execSync, spawnSync } from "child_process";
import ffmpeg from "fluent-ffmpeg";

import User from "../models/user.js";
import MindMap from "../models/mindMap.js";
import CommunityPost from "../models/CommunityPost.js";
import transporter from "../utils/email.js";

// ✅ Set FFmpeg path for your system
ffmpeg.setFfmpegPath(
  "C:\\Users\\hp\\Downloads\\ffmpeg-8.0-essentials_build\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe"
);

// ---------------- JWT ----------------
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ---------------- REGISTER ----------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, theme } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      avatar: avatar || "",
      theme:
        theme && ["light", "dark", "system"].includes(theme)
          ? theme
          : "light",
    });

    try {
      await transporter.sendMail({
        from: `"MindCare" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "🎉 Welcome to MindCare!",
        html: `
          <h2>Hi ${user.name},</h2>
          <p>Welcome to <b>MindCare</b> ✨</p>
          <p>Start journaling today and track your mood daily.</p>
          <a href="${process.env.CLIENT_URL}/login"
             style="padding:10px 20px;background:#6D28D9;color:#fff;text-decoration:none;border-radius:6px;">
            Login Now
          </a>
          <p style="margin-top:20px;color:gray;font-size:12px;">
            If you didn’t sign up for MindCare, ignore this email.
          </p>
        `,
      });
    } catch (mailErr) {
      console.warn("⚠️ Email send error:", mailErr.message);
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
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

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
    if (!text) return res.status(400).json({ message: "Text is required" });

    const post = await CommunityPost.create({
      text: filterSensitiveData(text),
      mood: mood || "neutral",
      date: new Date(),
      likes: { support: 0, relate: 0 },
      anonymous_id: uuidv4(),
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("❌ Share post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommunityPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find({}).sort({ date: -1 }).limit(50);
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
    if (!req.file) {
      console.error("❌ No audio file received.");
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log("🎤 Received file:", {
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // FFmpeg path
    const ffmpegPath =
      "C:\\Users\\hp\\Downloads\\ffmpeg-8.0-essentials_build\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe";

    const tempWebm = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
    const tempWav = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);

    // Write uploaded file to temp folder
    if (req.file.path) {
      fs.copyFileSync(req.file.path, tempWebm);
    } else {
      fs.writeFileSync(tempWebm, req.file.buffer);
    }

    // Convert webm → wav
    try {
      execSync(
        `"${ffmpegPath}" -y -i "${tempWebm}" -ar 16000 -ac 1 -c:a pcm_s16le "${tempWav}"`,
        { stdio: "ignore" }
      );
      console.log("✅ FFmpeg conversion success");

      // Debug WAV file
      console.log(
        "WAV exists:",
        fs.existsSync(tempWav),
        "Size:",
        fs.statSync(tempWav).size
      );

      const debugWavPath = path.join(process.cwd(), "debug_audio.wav");
      fs.copyFileSync(tempWav, debugWavPath);
      console.log("DEBUG WAV SAVED:", debugWavPath);

    } catch (err) {
      console.error("❌ FFmpeg conversion failed:", err);
      return res.status(500).json({ error: "FFmpeg conversion failed" });
    }

    // Correct Python script path
    const pythonScript = path.join(process.cwd(), "python/transcribe.py");

    console.log("🐍 Python script path being executed:", pythonScript);

    const result = spawnSync("python", [pythonScript, tempWav], {
      encoding: "utf-8",
    });

    console.log("🐍 PYTHON STDOUT:", result.stdout);
    console.error("🐍 PYTHON STDERR:", result.stderr);

    fs.unlinkSync(tempWebm);
    fs.unlinkSync(tempWav);

    if (result.error) {
      console.error("❌ Python error:", result.error);
      return res.status(500).json({ error: "Transcription failed" });
    }

    const outputText = result.stdout.trim();
    res.json({ text: outputText || "No speech detected" });

  } catch (error) {
    console.error("🔥 Transcription error:", error);
    res.status(500).json({
      error: "Transcription failed",
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
