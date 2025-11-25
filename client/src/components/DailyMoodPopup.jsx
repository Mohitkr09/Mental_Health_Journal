// src/components/DailyMoodPopup.jsx
import { useState, useEffect } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios";
import {
  Heart,
  Activity,
  Apple,
  PenLine,
  Moon,
  Sun,
} from "lucide-react";

export default function DailyMoodPopup() {
  const { user } = useAuth();
  const { addEntry } = useJournal();

  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedulePopup, setSchedulePopup] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const COLORS = {
    happy: "#4ade80",
    sad: "#60a5fa",
    neutral: "#d1d5db",
    anxious: "#f87171",
    angry: "#facc15",
    tired: "#a78bfa",
  };

  const moodEmojis = {
    happy: "😊",
    sad: "😢",
    neutral: "😐",
    anxious: "😰",
    angry: "😡",
    tired: "🥱",
  };

  // Icons for the schedule
  const icons = {
    meditation: <Heart className="text-blue-500" />,
    movement: <Activity className="text-green-500" />,
    food: <Apple className="text-orange-500" />,
    journal: <PenLine className="text-pink-500" />,
    sleep: <Moon className="text-indigo-500" />,
    default: <Sun className="text-purple-500" />,
  };

  /* -------- Show popup once per day -------- */
  useEffect(() => {
    if (!user) return;
    const lastPopup = localStorage.getItem(`lastPopupDate_${user._id}`);
    const today = new Date().toDateString();

    if (lastPopup !== today) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [user]);

  /* -------- Save mood + Generate Schedule -------- */
  const handleSave = async () => {
    if (!mood) return alert("Please select a mood first 😊");

    setLoading(true);
    try {
      const entryData = {
        text: `Daily quick log: Feeling ${mood} today.`,
        mood,
        date: new Date().toISOString(),
      };

      await addEntry(entryData);

      // Generate schedule from backend
      const res = await axios.post(
        `${API_BASE_URL}/api/schedule`,
        { mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSchedulePopup(res.data); // full schedule object

      // Mark popup shown for today
      localStorage.setItem(
        `lastPopupDate_${user._id}`,
        new Date().toDateString()
      );

      setIsOpen(false);
      setMood("");
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Something went wrong while saving your mood.");
    } finally {
      setLoading(false);
    }
  };

  /* -------- Skip mood selection -------- */
  const handleSkip = () => {
    localStorage.setItem(
      `lastPopupDate_${user._id}`,
      new Date().toDateString()
    );
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* ---- Main Mood Popup ---- */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-80 sm:w-96 text-center animate-fadeIn">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
            🌞 How are you feeling today?
          </h2>

          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {Object.keys(COLORS).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                disabled={loading}
                className={`px-3 py-2 rounded-full text-white capitalize transition-all duration-150 ${
                  mood === m
                    ? "ring-2 ring-purple-500 scale-110 shadow-md"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: COLORS[m] }}
              >
                {moodEmojis[m]} {m}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Skip
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Schedule Popup ---- */}
      {schedulePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-[90%] sm:w-96">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              📝 Your Wellness Schedule for Today
            </h2>

            <div className="space-y-3">
              {schedulePopup.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex justify-between items-start"
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-md bg-white dark:bg-gray-700 shadow">
                      {icons[item.type] || icons.default}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                      {item.durationMins && (
                        <p className="text-xs text-gray-500 mt-1">
                          ⏱ {item.durationMins} min
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSchedulePopup(null)}
              className="mt-5 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
