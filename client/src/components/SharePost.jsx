import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx"; // Adjust if using JournalContext or AuthContext

export default function SharePost({ onPostShared }) {
  const { token } = useAuth();
  const [text, setText] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(false);

  const moodOptions = ["happy", "sad", "neutral", "anxious", "angry", "tired"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/auth/community/share",
        { text, mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText("");
      setMood("neutral");
      if (onPostShared) onPostShared(data); // Update parent component
    } catch (err) {
      console.error("❌ Failed to share post:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 mb-6 bg-purple-50 dark:bg-gray-800 rounded-xl shadow-md transition-colors">
      <h3 className="font-semibold text-lg mb-3 text-purple-700 dark:text-purple-300">🌐 Share Anonymously</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a positive moment or coping strategy..."
          className="p-3 rounded-md border focus:outline-none focus:ring focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200"
          rows={4}
        />
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="p-2 rounded-md border focus:outline-none focus:ring focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200"
        >
          {moodOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? "Sharing..." : "Share Post"}
        </button>
      </form>
    </div>
  );
}
