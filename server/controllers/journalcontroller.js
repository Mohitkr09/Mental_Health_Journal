import mongoose from "mongoose";
import Journal from "../models/Journal.js";
import User from "../models/user.js";

// Get normalized User ID
const getUserIdFromReq = (req) => req.user?._id || req.user?.id;

/* ------------------------------------------------------------
   CREATE JOURNAL ENTRY
------------------------------------------------------------ */
// ------------------------------------------------------------
// CREATE JOURNAL ENTRY (FULLY FIXED)
// ------------------------------------------------------------
export const createJournal = async (req, res) => {
  try {
    const { text, mood } = req.body;

    // 🔥 REQUIRED FIX — ALWAYS RELY ON JWT
    const userId = req.user._id;

    if (!userId) {
      console.error("❌ No userId from token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!text || !mood) {
      return res.status(400).json({ error: "Text and mood are required" });
    }

    // TEMP DIAGNOSTIC LOGS
    console.log("🟣 Creating journal for user:", userId);

    // Save journal entry
    const journal = await Journal.create({
      userId: new mongoose.Types.ObjectId(userId),   // 👈 FIXED
      text,
      mood,
      aiResponse: getAiResponse(mood),
    });

    console.log("🟢 Saved journal:", journal);

    res.status(201).json({ journal });

  } catch (error) {
    console.error("❌ Create journal error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// helper for AI text
const getAiResponse = (mood) => {
  if (mood === "happy") return "That's great! Keep embracing positivity.";
  if (mood === "sad") return "It's okay to feel sad. Writing helps.";
  if (mood === "anxious") return "Take deep breaths. You're doing great.";
  return "Thanks for sharing your thoughts.";
};


/* ------------------------------------------------------------
   GET JOURNALS (LAST 30 DAYS)
------------------------------------------------------------ */
// ------------------------------------------------------------
// GET JOURNALS (LAST 30 DAYS)
// ------------------------------------------------------------
export const getJournals = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🔍 Fetching journals for:", userId);

    const cutoff = new Date(Date.now() - 30*24*60*60*1000);

    const journals = await Journal.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: cutoff }
    }).sort({ createdAt: -1 });

    console.log("📤 Journals fetched:", journals.length);

    res.json(journals);

  } catch (err) {
    console.error("❌ Error fetching journals:", err);
    res.status(500).json({ error: "Server error" });
  }
};


