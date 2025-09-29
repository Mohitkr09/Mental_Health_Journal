// src/pages/Journal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx"; 

export default function Journal() {
  const { theme } = useTheme();

  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [journals, setJournals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🎮 Gamification
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);

  // 🔎 Filters
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("");

  // Axios instance
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const journalRes = await api.get("/journal");
        setJournals(journalRes.data);

        const userRes = await api.get("/users/profile");
        setStreak(userRes.data.streak || 0);
        setBadges(userRes.data.badges || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("⚠️ Failed to load journals. Please log in again.");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/journal", { text, mood });
      setJournals([res.data.journal, ...journals]);

      if (res.data.streak !== undefined) setStreak(res.data.streak);
      if (res.data.badges) setBadges(res.data.badges);

      setText("");
      setMood("");
    } catch (err) {
      console.error("Error saving journal:", err);
      setError("⚠️ Failed to save journal entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id, updatedText) => {
    try {
      const res = await api.put(`/journal/${id}`, { text: updatedText });
      setJournals(journals.map(j => j._id === id ? res.data.journal : j));
    } catch (err) {
      console.error("Error editing entry:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/journal/${id}`);
      setJournals(journals.filter(j => j._id !== id));
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const groupedEntries = journals.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const filteredEntries = Object.entries(groupedEntries).map(([date, entries]) => [
    date,
    entries.filter(
      e =>
        (!filterMood || e.mood === filterMood) &&
        e.text.toLowerCase().includes(search.toLowerCase())
    ),
  ]);

  const moods = [
    { value: "happy", label: "😊 Happy" },
    { value: "sad", label: "😢 Sad" },
    { value: "anxious", label: "😟 Anxious" },
    { value: "neutral", label: "😐 Neutral" },
  ];

  // ✅ Theme-based classes
  const pageBg = theme === "dark" ? "bg-gray-900" : "bg-purple-50";
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-900";
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-300";
  const badgeBg = theme === "dark" ? "bg-yellow-700 text-yellow-200" : "bg-yellow-200 text-yellow-800";
  const moodSelected = theme === "dark" ? "bg-purple-700 text-white" : "bg-purple-500 text-white";
  const moodUnselected = theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800";
  const inputBg = theme === "dark" ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-900 border-gray-300";
  const buttonBg = theme === "dark" ? "bg-purple-700 hover:bg-purple-800" : "bg-blue-500 hover:bg-blue-600";

  return (
    <div className={`${pageBg} p-6 min-h-screen transition-colors duration-300`}>
      <h1 className={`text-2xl font-bold mb-4 ${textColor}`}>My Journal</h1>

      {/* 🎮 Gamification */}
      <div className={`${cardBg} ${borderColor} mb-6 p-4 border rounded-lg transition-colors duration-300`}>
        <p className={`text-lg font-semibold ${textColor}`}>🔥 Streak: {streak} days</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {badges.length > 0 ? (
            badges.map((badge, i) => (
              <span key={i} className={`px-3 py-1 text-sm font-medium rounded-full ${badgeBg}`}>
                🏅 {badge}
              </span>
            ))
          ) : (
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              No badges yet. Keep journaling!
            </p>
          )}
        </div>
      </div>

      {/* Journal Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <textarea
          className={`w-full p-3 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300`}
          rows="4"
          placeholder="Write your thoughts..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />

        {/* Mood Quick Select */}
        <div className="flex gap-3">
          {moods.map((m) => (
            <button
              type="button"
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
                mood === m.value ? moodSelected : moodUnselected
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${buttonBg} disabled:opacity-50 transition-colors duration-300`}
        >
          {loading ? "Saving..." : "Save Entry"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      {/* 🔎 Filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search journals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`border p-2 rounded-lg flex-1 ${inputBg} transition-colors duration-300`}
        />
        <select
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          className={`border p-2 rounded-lg ${inputBg} transition-colors duration-300`}
        >
          <option value="">All moods</option>
          {moods.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Journal Entries */}
      {filteredEntries.map(([date, entries]) =>
        entries.length > 0 && (
          <div key={date} className="mb-6">
            <h2 className={`text-lg font-bold mb-3 ${textColor}`}>{date}</h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry._id} className={`${cardBg} border ${borderColor} p-4 rounded-lg shadow-sm relative transition-colors duration-300`}>
                  <p className={`${textColor}`}>{entry.text}</p>
                  <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Mood: {entry.mood}</p>
                  {entry.aiResponse && (
                    <p className="text-sm mt-2 text-blue-400">AI Reflection: {entry.aiResponse}</p>
                  )}
                  <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </p>

                  {/* Edit & Delete */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => {
                        const newText = prompt("Edit entry:", entry.text);
                        if (newText) handleEdit(entry._id, newText);
                      }}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
