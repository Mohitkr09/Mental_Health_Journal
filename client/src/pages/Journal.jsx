// src/pages/Journal.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function Journal() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [journals, setJournals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🎮 Gamification states
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);

  // Create a reusable Axios instance with token
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch all journals & user gamification data
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

      // Add the new entry to the top of the list
      setJournals([res.data.journal, ...journals]);

      // Update streak & badges from response
      if (res.data.streak !== undefined) setStreak(res.data.streak);
      if (res.data.badges) setBadges(res.data.badges);

      // Clear form
      setText("");
      setMood("");
    } catch (err) {
      console.error("Error saving journal:", err);
      setError("⚠️ Failed to save journal entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Journal</h1>

      {/* 🎮 Gamification Section */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-lg font-semibold">🔥 Streak: {streak} days</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {badges.length > 0 ? (
            badges.map((badge, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full"
              >
                🏅 {badge}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-600">
              No badges yet. Keep journaling!
            </p>
          )}
        </div>
      </div>

      {/* Journal Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <textarea
          className="w-full border p-3 rounded-lg"
          rows="4"
          placeholder="Write your thoughts..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />

        <select
          className="w-full border p-3 rounded-lg"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          required
        >
          <option value="">Select mood</option>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="anxious">😟 Anxious</option>
          <option value="neutral">😐 Neutral</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Entry"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      {/* Journal Entries */}
      <div className="space-y-4">
        {journals.map((entry) => (
          <div
            key={entry._id}
            className="border p-4 rounded-lg shadow-sm bg-gray-50"
          >
            <p className="text-gray-800">{entry.text}</p>
            <p className="text-sm text-gray-600 mt-2">Mood: {entry.mood}</p>
            {entry.aiResponse && (
              <p className="text-sm text-blue-600 mt-2">
                AI Reflection: {entry.aiResponse}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
