import Journal from "../models/Journal.js";
import User from "../models/user.js"; // make sure you have this

// --- Create Journal Entry + Update Gamification ---
export const createJournal = async (req, res) => {
  try {
    const { text, mood } = req.body;
    const userId = req.user.id; // assuming you’re using JWT auth middleware

    if (!text) return res.status(400).json({ error: "Text is required" });

    // (Optional AI response)
    let aiResponse = "";
    if (mood === "happy") aiResponse = "That's great! Keep embracing the positivity.";
    else if (mood === "sad") aiResponse = "It's okay to feel sad. Writing it down is a good step.";
    else if (mood === "anxious") aiResponse = "Take a deep breath, you’re doing well.";
    else aiResponse = "Thanks for sharing your thoughts today.";

    // Save journal
    const journal = await Journal.create({ user: userId, text, mood, aiResponse });

    // --- Update User Streaks & Badges ---
    const user = await User.findById(userId);

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (user.lastJournalDate?.toDateString() === yesterday) {
      user.streak += 1; // continue streak
    } else if (user.lastJournalDate?.toDateString() !== today) {
      user.streak = 1; // reset streak
    }

    user.lastJournalDate = new Date();

    // Assign badges
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
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// --- Get Journals for Logged-in User ---
export const getJournals = async (req, res) => {
  try {
    const userId = req.user.id;
    const journals = await Journal.find({ user: userId }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
