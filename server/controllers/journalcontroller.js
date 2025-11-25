import Journal from "../models/Journal.js";
import User from "../models/user.js";

// Normalize user ID from JWT middleware
const getUserIdFromReq = (req) => req.user?._id || req.user?.id;

// --- Create Journal Entry + Update Gamification ---
export const createJournal = async (req, res) => {
  try {
    const { text, mood } = req.body;
    const userId = getUserIdFromReq(req);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!text) return res.status(400).json({ error: "Text is required" });

    // AI reflection
    let aiResponse = "";
    if (mood === "happy") aiResponse = "That's great! Keep embracing positivity.";
    else if (mood === "sad") aiResponse = "It's okay to feel sad. Writing helps.";
    else if (mood === "anxious") aiResponse = "Take deep breaths. You're doing great.";
    else aiResponse = "Thanks for sharing your thoughts.";

    // MUST save using userId (your schema requires this!)
    const journal = await Journal.create({
      userId,
      text,
      mood,
      aiResponse,
    });

    // Update streak and badges
    const user = await User.findById(userId);

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (user.lastJournalDate?.toDateString() === yesterday) {
      user.streak += 1;
    } else if (user.lastJournalDate?.toDateString() !== today) {
      user.streak = 1;
    }

    user.lastJournalDate = new Date();

    // Badges
    if (user.streak === 3 && !user.badges.includes("3-day Streak")) {
      user.badges.push("3-day Streak");
    }
    if (user.streak === 7 && !user.badges.includes("1-week Streak")) {
      user.badges.push("1-week Streak");
    }
    if (user.badges.length >= 5 && !user.badges.includes("Collector")) {
      user.badges.push("Collector");
    }

    await user.save();

    res.status(201).json({
      journal,
      streak: user.streak,
      badges: user.badges,
      aiResponse,
    });

  } catch (error) {
    console.error("Create journal error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// --- Get Last 30 Days Journals ---
export const getJournals = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // MUST query with userId not user
    const journals = await Journal.find({
      userId,
      createdAt: { $gte: cutoff },
    }).sort({ createdAt: -1 });

    res.json(journals);
  } catch (error) {
    console.error("Get journals error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
