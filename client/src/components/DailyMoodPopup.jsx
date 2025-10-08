// src/components/DailyMoodPopup.jsx
import { useState, useEffect } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DailyMoodPopup() {
  const { user } = useAuth();
  const { addEntry } = useJournal();
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    const lastPopup = localStorage.getItem(`lastPopupDate_${user._id}`);
    const today = new Date().toDateString();
    if (lastPopup !== today) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSave = async () => {
    if (!mood) return alert("Please select a mood first 😊");
    if (!user) return alert("Please log in to save your mood");

    setLoading(true);
    try {
      const entryData = {
        text: `Daily quick log: Feeling ${mood} today.`,
        mood,
        date: new Date().toISOString(),
      };

      // Add entry → updates context immediately
      await addEntry(entryData);

      localStorage.setItem(`lastPopupDate_${user._id}`, new Date().toDateString());
      setIsOpen(false);
      setMood("");
    } catch (err) {
      console.error("❌ Error saving mood:", err);
      alert(err.message || "Failed to save mood.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (user) localStorage.setItem(`lastPopupDate_${user._id}`, new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-96 text-center transition-all duration-300 scale-100 animate-fadeIn">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          🌞 How are you feeling today?
        </h2>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {Object.keys(COLORS).map((m) => (
            <button
              key={m}
              type="button"
              aria-label={m}
              onClick={() => setMood(m)}
              disabled={loading}
              title={m}
              className={`px-3 py-2 rounded-full text-white capitalize transition-all duration-150 focus:outline-none ${
                mood === m ? "ring-2 ring-purple-500 scale-110 shadow-md" : "hover:scale-105"
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all duration-200 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
