import { useMemo, useState, useEffect } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Loader2, Heart, HandHelping, Send } from "lucide-react";

export default function Insights() {
  const { entries, loading: contextLoading, error: contextError } = useJournal();
  const { theme } = useTheme();

  // ===== Community Wall State =====
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // ===== Fetch Community Posts =====
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/community/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setCommunityPosts(
          res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      }
    } catch (err) {
      console.error("Error fetching community posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  // ===== Handle Posting =====
  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/community/share`,
        { text: newPost.trim(), mood: "neutral" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data) {
        setCommunityPosts((prev) => [res.data, ...prev]);
        setNewPost("");
      }
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setPosting(false);
    }
  };

  // ===== Handle React (Support / Relate) =====
  const handleReact = async (postId, type) => {
    try {
      setCommunityPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, likes: { ...post.likes, [type]: (post.likes?.[type] || 0) + 1 } }
            : post
        )
      );
      await axios.post(
        `${API_BASE_URL}/api/auth/community/react`,
        { postId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("React error:", err);
    }
  };

  // ===== Mood Graph Logic =====
  const moodScale = {
    sad: 1,
    tired: 2,
    neutral: 3,
    anxious: 4,
    angry: 5,
    happy: 6,
  };

  const [selectedMood, setSelectedMood] = useState("all");

  const filteredEntries = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    return entries.filter(
      (item) => item.mood && (selectedMood === "all" || item.mood === selectedMood)
    );
  }, [entries, selectedMood]);

  const lineData = useMemo(() => {
    const grouped = {};
    filteredEntries.forEach((item) => {
      const date = new Date(item.date || item.createdAt).toLocaleDateString();
      grouped[date] = {
        date,
        moodValue: moodScale[item.mood] || 3,
        moodLabel: item.mood,
      };
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredEntries]);

  // ===== Mood Distribution Data =====
  const moodDistribution = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    const counts = {};
    entries.forEach((item) => {
      if (item.mood) counts[item.mood] = (counts[item.mood] || 0) + 1;
    });
    return Object.keys(moodScale).map((mood) => ({
      mood,
      count: counts[mood] || 0,
    }));
  }, [entries]);

  const chartBg = theme === "dark" ? "#1f2937" : "#ffffff";
  const textColor = theme === "dark" ? "#f3f4f6" : "#111827";

  if (contextLoading)
    return <p className="text-center text-gray-500 mt-8">⏳ Loading insights...</p>;
  if (contextError)
    return <p className="text-center text-red-500 mt-8">{contextError}</p>;

  return (
    <div
      className={`max-w-5xl mx-auto px-4 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-purple-50"
      }`}
    >
      {/* ===== Mood vs Date Graph ===== */}
      <div
        className="p-6 rounded-xl shadow-md mt-10 mb-10 border border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          📈 Mood vs Date
        </h3>

        <div className="mb-4">
          <label className="mr-2" style={{ color: textColor }}>
            Filter by Mood:
          </label>
          <select
            className="p-2 rounded border dark:border-gray-600"
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
          >
            <option value="all">All</option>
            {Object.keys(moodScale).map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>

        {lineData.length === 0 ? (
          <p className="text-gray-500">No mood data available for this selection.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={textColor} />
              <YAxis
                domain={[1, 6]}
                ticks={[1, 2, 3, 4, 5, 6]}
                stroke={textColor}
                tickFormatter={(v) =>
                  Object.keys(moodScale).find((key) => moodScale[key] === v)
                }
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `Mood: ${props.payload?.moodLabel || "neutral"}`,
                  "Mood Value",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#3b82f6"
                activeDot={{ r: 8 }}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ===== Mood Distribution Graph ===== */}
      <div
        className="p-6 rounded-xl shadow-md mb-10 border border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          📊 Mood Distribution
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={moodDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mood" stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Community Wall ===== */}
      <div
        className="p-6 rounded-xl shadow-md mb-10 border border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          🌐 Community Wall
        </h3>

        <textarea
          className="w-full p-3 mb-3 rounded-lg border dark:border-gray-600 resize-none"
          style={{
            backgroundColor: theme === "dark" ? "#374151" : "#f9fafb",
            color: textColor,
          }}
          placeholder="Share your thoughts with the community..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={3}
        />
        <button
          onClick={handlePost}
          disabled={posting}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {posting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          {posting ? "Posting..." : "Share"}
        </button>

        {loadingPosts ? (
          <p className="mt-4" style={{ color: textColor }}>
            ⏳ Loading posts...
          </p>
        ) : communityPosts.length === 0 ? (
          <p className="mt-4 text-gray-500">No posts yet. Be the first to share 🌱</p>
        ) : (
          <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
            {communityPosts.map((post) => (
              <div
                key={post._id}
                className="p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition hover:shadow-md"
                style={{
                  backgroundColor: theme === "dark" ? "#2d3748" : "#f3f4f6",
                  color: textColor,
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      post.mood === "happy"
                        ? "bg-green-100 text-green-700"
                        : post.mood === "sad"
                        ? "bg-blue-100 text-blue-700"
                        : post.mood === "angry"
                        ? "bg-red-100 text-red-700"
                        : post.mood === "anxious"
                        ? "bg-yellow-100 text-yellow-700"
                        : post.mood === "tired"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {post.mood || "neutral"}
                  </span>
                </div>

                <p className="mb-3">{post.text || post.content}</p>

                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => handleReact(post._id, "support")}
                    className="flex items-center gap-1 hover:text-indigo-600 transition"
                  >
                    <HandHelping className="w-4 h-4" />
                    Support ({post.likes?.support || 0})
                  </button>
                  <button
                    onClick={() => handleReact(post._id, "relate")}
                    className="flex items-center gap-1 hover:text-pink-500 transition"
                  >
                    <Heart className="w-4 h-4" />
                    Relate ({post.likes?.relate || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
