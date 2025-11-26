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
  CheckCircle2,
} from "lucide-react";

export default function DailyMoodPopup() {
  const { user } = useAuth();
  const { addEntry } = useJournal();

  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedulePopup, setSchedulePopup] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
    happy: "😄",
    sad: "😢",
    neutral: "😐",
    anxious: "😰",
    angry: "😡",
    tired: "🥱",
  };

  const icons = {
    meditation: <Heart className="text-pink-500" />,
    movement: <Activity className="text-green-500" />,
    food: <Apple className="text-orange-500" />,
    journal: <PenLine className="text-purple-500" />,
    sleep: <Moon className="text-indigo-400" />,
    default: <Sun className="text-yellow-500" />,
  };

  /* -------- Show popup once per day -------- */
  useEffect(() => {
    if (!user) return;
    const lastPopup = localStorage.getItem(`lastPopupDate_${user._id}`);
    const today = new Date().toDateString();

    if (lastPopup !== today) {
      setTimeout(() => setIsOpen(true), 900);
    }
  }, [user]);

  /* -------- Save mood + generate schedule -------- */
  const handleSave = async () => {
    if (!mood) return alert("Please choose a mood first 😄");

    setLoading(true);
    try {
      await addEntry({
        text: `Daily quick log: Feeling ${mood} today.`,
        mood,
        date: new Date().toISOString(),
      });

      const res = await axios.post(
        `${API_BASE_URL}/api/schedule`,
        { mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSchedulePopup(res.data);
      localStorage.setItem(`lastPopupDate_${user._id}`, new Date().toDateString());
      setIsOpen(false);
      setMood("");
    } catch (err) {
      alert("Unable to save mood. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`lastPopupDate_${user._id}`, new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] animate-fadeIn">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl w-80 sm:w-96 relative overflow-hidden animate-scaleIn">

          {/* Decorative gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-400/5 pointer-events-none" />

          <h2 className="relative text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            🌞 How are you feeling today?
          </h2>

          {/* Mood buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Object.keys(COLORS).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                disabled={loading}
                className={`px-4 py-2 rounded-full text-white flex gap-1 items-center text-sm shadow-md active:scale-95 transition-all ${
                  mood === m
                    ? "ring-4 ring-purple-500/60 scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: COLORS[m] }}
              >
                <span className="text-md animate-bounce">{moodEmojis[m]}</span>
                {m}
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-2 gap-3">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Skip
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition shadow-md flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ===== Schedule POPUP ===== */}
      {schedulePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-[110] animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl w-[90%] sm:w-96 animate-scaleIn">

            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              📝 Your Wellness Plan
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {schedulePopup.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:shadow-md hover:border-purple-400 transition"
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-md bg-white dark:bg-gray-700 shadow-md">
                      {icons[item.type] || icons.default}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                      {item.durationMins && (
                        <p className="text-xs text-purple-500 mt-1">⏱ {item.durationMins} min</p>
                      )}
                    </div>
                  </div>

                  <span className="text-purple-600 font-semibold text-sm">{item.time}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSchedulePopup(null)}
              className="mt-5 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
