import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";

// Import routes
import journalRoutes from "./routes/journalRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

// Services
import startReminderService from "./services/reminderService.js";

dotenv.config();
const app = express();

/* --------------------------------------------------
   CORS CONFIG — CORRECT & PRODUCTION SAFE
---------------------------------------------------*/

const allowedOrigins = [
  process.env.CLIENT_URL,                                   // From ENV
  "https://mental-health-journal-ml61.vercel.app",          // Your Vercel frontend
  "http://localhost:5173"                                   // Local dev
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // allow mobile/postman

      const normalizedOrigin = origin.replace(/\/$/, ""); // remove trailing slash
      const isAllowed = allowedOrigins.some((o) =>
        normalizedOrigin.startsWith(o.replace(/\/$/, ""))
      );

      if (isAllowed) return callback(null, true);

      console.warn(`🚫 CORS BLOCKED: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
   API ROUTES (Notice each route already includes /api)
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

/* --------------------------------------------------
   GLOBAL ERROR HANDLER
---------------------------------------------------*/
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message || err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

/* --------------------------------------------------
   SERVER INIT
---------------------------------------------------*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
