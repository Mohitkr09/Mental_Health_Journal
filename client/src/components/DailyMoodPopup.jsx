// src/components/DailyMoodPopup.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useJournal } from "../context/JournalContext.jsx"; // ✅ use context

export default function DailyMoodPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState("");
  const { addEntry } = useJournal(); // ✅ context function to update entries

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

  // ✅ Show popup only once per day
  useEffect(() => {
    const lastPopup = localStorage.getItem("lastPopupDate");
    const today = new Date().toDateString();
    if (lastPopup !== today) setIsOpen(true);
  }, []);

  const handleSave = async () => {
    if (!mood) return alert("Please select a mood");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/journal",
        { text: `Daily quick log: feeling ${mood}`, mood, date: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update context so graphs auto-refresh
      addEntry(res.data);

      // ✅ Mark today's popup as done
      localStorage.setItem("lastPopupDate", new Date().toDateString());
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving mood:", err);
      alert("Failed to save mood.");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("lastPopupDate", new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center">
        <h2 className="text-lg font-semibold mb-3">🌞 How are you feeling today?</h2>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {Object.keys(COLORS).map((m) => (
            <button
              key={m}
              className={`px-3 py-2 rounded ${mood === m ? "ring-2 ring-purple-500" : ""}`}
              style={{ backgroundColor: COLORS[m], color: "#fff" }}
              onClick={() => setMood(m)}
            >
              {moodEmojis[m]} {m}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={handleSkip}>
            Skip
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
