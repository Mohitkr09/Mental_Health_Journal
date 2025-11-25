// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

// Import routes
import journalRoutes from "./routes/journalRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // Auth + Community
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";



// Reminder Service
import startReminderService from "./services/reminderService.js";

dotenv.config();
const app = express();

// ====== CORS FIX FOR PRODUCTION ======
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // Vercel URL required!
    credentials: true,
  })
);

// ====== Middlewares ======
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));

// ====== Database Connection ======
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    startReminderService();
  })
  .catch((err) => {
    console.error("🔥 MongoDB connection error:", err.message);
    process.exit(1);
  });

// ====== API ROUTES ======
app.use("/api/journal", journalRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);  // register/login/mindmap/community
app.use("/api/users", userRoutes); // profile, avatar upload
app.use("/api/analytics", analyticsRoutes);
app.use("/api/schedule", scheduleRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "🚀 API is running" });
});

// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ====== Start Server ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
