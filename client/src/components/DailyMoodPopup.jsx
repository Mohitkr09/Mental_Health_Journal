// src/components/DailyMoodPopup.jsx
import { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // ✅ import AuthContext

export default function DailyMoodPopup() {
  const { user } = useAuth(); // ✅ no more props
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const { addEntry } = useJournal();

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

  // ✅ Show popup once per day only if user is logged in
  useEffect(() => {
    if (!user) return;

    const lastPopup = localStorage.getItem("lastPopupDate");
    const today = new Date().toDateString();
    if (lastPopup !== today) setIsOpen(true);
  }, [user]);

  const handleSave = async () => {
    if (!mood) return alert("Please select a mood");
    if (!user) return alert("Please log in to save your mood");

    setLoading(true);
    try {
      const res = await api.post("/journal", {
        text: `Daily quick log: feeling ${mood}`,
        mood,
        date: new Date().toISOString(),
      });

      addEntry(res.data); // ✅ update JournalContext
      localStorage.setItem("lastPopupDate", new Date().toDateString());
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving mood:", err);
      alert(err.response?.data?.message || "Failed to save mood.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("lastPopupDate", new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-96 text-center transition-colors duration-300">
        <h2 className="text-lg font-semibold mb-3">🌞 How are you feeling today?</h2>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {Object.keys(COLORS).map((m) => (
            <button
              key={m}
              type="button"
              aria-label={m}
              className={`px-3 py-2 rounded transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                mood === m ? "ring-2 ring-purple-500 scale-105" : "hover:scale-105"
              }`}
              style={{ backgroundColor: COLORS[m], color: "#fff" }}
              onClick={() => setMood(m)}
              title={m}
              disabled={loading}
            >
              {moodEmojis[m]} {m}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors duration-200 disabled:opacity-60"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
