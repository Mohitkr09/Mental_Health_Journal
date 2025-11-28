// server/controllers/scheduleController.js
import Schedule from "../models/Schedule.js";
import dayjs from "dayjs";

/* --- keep or reuse your generateSchedule function --- */
const generateSchedule = (mood) => {
  const format = (h, m = 0) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const common = [
    { time: format(7, 0), title: "Wake up & hydrate", description: "Drink water and stretch", type: "movement", durationMins: 5 },
    { time: format(8, 0), title: "Balanced breakfast", description: "Protein + fruit", type: "food", durationMins: 20 },
    { time: format(12, 30), title: "Healthy lunch", description: "Lean protein + vegetables", type: "food", durationMins: 30 },
    { time: format(18, 0), title: "Light movement", description: "20 min walking", type: "movement", durationMins: 20 },
    { time: format(21, 0), title: "Wind down", description: "Journal 5 minutes", type: "journal", durationMins: 10 },
    { time: format(22, 30), title: "Prepare for sleep", description: "7–9 hours sleep", type: "sleep" }
  ];

  switch (mood) {
    case "anxious":
      return [
        { time: format(7, 0), title: "Breathing exercise", description: "5 min box breathing", type: "meditation", durationMins: 5 },
        ...common
      ];
    case "sad":
      return [
        { time: format(8, 0), title: "Gentle yoga", description: "10 min stretch", type: "movement", durationMins: 10 },
        ...common
      ];
    case "tired":
      return [
        { time: format(14, 30), title: "20 min power nap", description: "", type: "sleep", durationMins: 20 },
        ...common
      ];
    case "angry":
      return [
        { time: format(12, 0), title: "Energy release", description: "10 min fast-paced walk", type: "movement", durationMins: 10 },
        ...common
      ];
    case "happy":
      return [
        { time: format(7, 0), title: "Gratitude", description: "List 3 things you're grateful for", type: "journal", durationMins: 5 },
        ...common
      ];
    default:
      return common;
  }
};

export const createOrUpdateSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mood } = req.body;
    if (!mood) return res.status(400).json({ message: "Mood is required" });

    const date = dayjs().format("YYYY-MM-DD");
    const items = generateSchedule(mood);

    const schedule = await Schedule.findOneAndUpdate(
      { user: userId, date },
      {
        $set: { mood, items },
        $setOnInsert: { completed: [], sleepTip: "Aim for 7–9 hours", stressScore: 2 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(schedule);
  } catch (err) {
    console.error("Schedule create error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get schedule
export const getSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = req.query.date || dayjs().format("YYYY-MM-DD");
    const schedule = await Schedule.findOne({ user: userId, date });
    res.json(schedule || null);
  } catch (err) {
    console.error("Get schedule error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle completion for an item (index)
export const toggleComplete = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, index } = req.body;
    if (typeof index !== "number") return res.status(400).json({ message: "Index is required" });

    const schedDate = date || dayjs().format("YYYY-MM-DD");
    const schedule = await Schedule.findOne({ user: userId, date: schedDate });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const already = schedule.completed.includes(index);
    if (already) {
      schedule.completed = schedule.completed.filter((i) => i !== index);
    } else {
      schedule.completed.push(index);
    }
    await schedule.save();

    res.json({ success: true, completed: schedule.completed });
  } catch (err) {
    console.error("Toggle complete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get weekly dashboard
export const getWeeklyDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    // last 7 days
    const days = Array.from({ length: 7 }).map((_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD"));
    const results = [];
    for (const d of days) {
      const s = await Schedule.findOne({ user: userId, date: d });
      results.push({
        date: d,
        mood: s?.mood || null,
        total: s?.items?.length || 0,
        completed: s?.completed?.length || 0,
      });
    }
    res.json({ data: results.reverse() }); // chronological
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Simple AI Recommendations (rule-based)
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = req.query.date || dayjs().format("YYYY-MM-DD");
    const schedule = await Schedule.findOne({ user: userId, date });

    const recs = [];
    const mood = schedule?.mood || "neutral";
    if (mood === "anxious") {
      recs.push("Try 5–10 minutes of guided breathing mid-morning.");
      recs.push("Limit caffeine after 2pm to reduce jitteriness.");
    } else if (mood === "sad") {
      recs.push("Add a short uplifting walk with a friend or podcast.");
      recs.push("Try listing 3 small wins before bed.");
    } else if (mood === "tired") {
      recs.push("Aim for consistent sleep/wake within 30 minutes.");
      recs.push("Avoid screens 30 mins before bedtime.");
    } else if (mood === "angry") {
      recs.push("Take short breaks during the day for fast paced movement.");
      recs.push("Try writing down triggers when you feel angry.");
    } else if (mood === "happy") {
      recs.push("Celebrate small wins — consider sharing gratitude in your journal.");
    } else {
      recs.push("Keep a small, consistent bedtime routine (reading, warm drink).");
    }

    // Also add schedule-based tips
    if (schedule && schedule.items.some((it) => it.type === "sleep")) {
      recs.push("If sleep item present, aim to align mealtimes 2-3 hours before bed.");
    }

    res.json({ recommendations: recs });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
