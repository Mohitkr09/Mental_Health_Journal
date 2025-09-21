import User from "../models/user.js";
import jwt from "jsonwebtoken";
import transporter from "../utils/email.js"; // ✅ Import email utility

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ---------------- REGISTER ----------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, theme } = req.body;

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // create new user
    const user = await User.create({
      name,
      email,
      password,
      avatar: avatar || "",
      theme: theme && ["light", "dark", "system"].includes(theme) ? theme : "light",
    });

    // ✅ Send Welcome Email
    try {
      await transporter.sendMail({
        from: `"MindCare" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "🎉 Welcome to MindCare!",
        html: `
          <h2>Hi ${user.name},</h2>
          <p>Welcome to <b>MindCare</b> ✨</p>
          <p>We’re excited to have you here. Start journaling today and track your mood daily.</p>
          <br/>
          <a href="${process.env.CLIENT_URL}/login" 
             style="padding:10px 20px;background:#6D28D9;color:#fff;text-decoration:none;border-radius:6px;">
            Login Now
          </a>
          <p style="margin-top:20px;color:gray;font-size:12px;">
            If you didn’t sign up for MindCare, you can ignore this email.
          </p>
        `,
      });
      console.log(`📧 Welcome email sent to ${user.email}`);
    } catch (mailErr) {
      console.error("❌ Email send error:", mailErr.message);
    }

    // ✅ Response
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- TOGGLE THEME ----------------
export const toggleTheme = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Switch between light & dark
    user.theme = user.theme === "light" ? "dark" : "light";

    await user.save();

    res.json({ message: "Theme updated", theme: user.theme });
  } catch (error) {
    console.error("❌ Toggle theme error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
