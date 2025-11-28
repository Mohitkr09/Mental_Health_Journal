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
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

// Reminder Service
import startReminderService from "./services/reminderService.js";

dotenv.config();
const app = express();

/* --------------------------------------------------
   CORS CONFIG — FIXED FOR PROD + DEV
---------------------------------------------------*/
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://mental-health-journal-1c2a.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, ""); // remove trailing slash
      const isAllowed = allowedOrigins.some((o) =>
        cleanOrigin.startsWith(o.replace(/\/$/, ""))
      );

      if (isAllowed) return callback(null, true);

      console.warn(`🚫 CORS BLOCKED: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


/* --------------------------------------------------
   MIDDLEWARE
---------------------------------------------------*/
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));

/* --------------------------------------------------
   DATABASE CONNECTION
---------------------------------------------------*/
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

/* --------------------------------------------------
   API ROUTES
---------------------------------------------------*/
app.use("/api/journal", journalRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/schedule", scheduleRoutes);

/* --------------------------------------------------
   HEALTH CHECK
---------------------------------------------------*/
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "🚀 API is running" });
});


app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message || err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
