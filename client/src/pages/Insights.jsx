import { useMemo, useState, useEffect } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { ReactFlowProvider } from "reactflow";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

export default function Insights() {
  const { entries, loading: contextLoading, error: contextError } = useJournal();
  const { theme } = useTheme();

  // ===== Community Wall State =====
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);

  // ===== Fetch Community Posts =====
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await axios.get("/api/community/posts");
        if (Array.isArray(res.data)) {
          setCommunityPosts(
            res.data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          );
        }
      } catch (err) {
        console.error("Error fetching community posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // ===== Handle Posting to Community Wall =====
  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await axios.post("/api/community/posts", {
        content: newPost.trim(),
      });
      if (res.data) {
        setCommunityPosts((prev) => [res.data, ...prev]);
        setNewPost("");
      }
    } catch (err) {
      console.error("Error posting community entry:", err);
    } finally {
      setPosting(false);
    }
  };

  // ===== Mood Settings =====
  const COLORS = {
    happy: "#4ade80",
    sad: "#60a5fa",
    neutral: "#d1d5db",
    anxious: "#f87171",
    angry: "#facc15",
    tired: "#a78bfa",
  };

  const moodScale = {
    sad: 1,
    tired: 2,
    neutral: 3,
    anxious: 4,
    angry: 5,
    happy: 6,
  };

  // ===== Filter Entries with Mood =====
  const moodEntries = useMemo(
    () => (Array.isArray(entries) ? entries.filter((e) => e.mood) : []),
    [entries]
  );

  // ===== Line Chart Data =====
  const lineData = useMemo(() => {
    return moodEntries
      .map((item) => ({
        date: new Date(item.date || item.createdAt).toLocaleDateString(),
        moodValue: moodScale[item.mood] || 0,
        moodLabel: item.mood || "neutral",
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [moodEntries]);

  // ===== Pie Chart Data =====
  const pieData = useMemo(() => {
    if (!moodEntries.length) return [];
    const moodCounts = moodEntries.reduce((acc, item) => {
      acc[item.mood] = (acc[item.mood] || 0) + 1;
      return acc;
    }, {});
    const totalMoods = moodEntries.length;
    return Object.keys(moodCounts).map((m) => ({
      name: m,
      value: ((moodCounts[m] / totalMoods) * 100).toFixed(1),
    }));
  }, [moodEntries]);

  // ===== Heatmap Data =====
  const heatmapData = useMemo(() => {
    const grouped = {};
    moodEntries.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split("T")[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.keys(grouped).map((date) => ({ date, count: grouped[date] }));
  }, [moodEntries]);

  // ===== Weekly Summary =====
  const getMoodMessage = (mood) => {
    switch (mood) {
      case "happy":
        return "You’ve been feeling upbeat lately! What’s been contributing to your joy?";
      case "sad":
        return "It seems like you’ve had some low days. Is there something that’s been weighing on your mind?";
      case "anxious":
        return "You’ve reported feeling anxious recently. Would reflecting on your triggers help?";
      case "angry":
        return "There’s some frustration showing up. Try writing about what’s been bothering you.";
      case "tired":
        return "You’ve been feeling drained. Maybe it’s time for some rest or self-care.";
      default:
        return "Keep observing your emotions — every mood teaches you something valuable.";
    }
  };

  const weeklySummary = useMemo(() => {
    if (!moodEntries.length) return null;
    const last7 = moodEntries.slice(-7);
    const avg =
      last7.reduce((a, e) => a + (moodScale[e.mood] || 0), 0) / last7.length;
    const dominantMood = Object.entries(
      last7.reduce((acc, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0][0];
    return {
      avgMood: avg.toFixed(1),
      dominantMood,
      message: getMoodMessage(dominantMood),
    };
  }, [moodEntries]);

  // ===== Theme Colors =====
  const chartBg = theme === "dark" ? "#1f2937" : "#ffffff";
  const textColor = theme === "dark" ? "#f3f4f6" : "#111827";
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";

  // ===== Health Data Simulation =====
  const healthData = useMemo(
    () =>
      moodEntries.map((entry) => {
        const date = new Date(entry.date || entry.createdAt).toLocaleDateString();
        return {
          date,
          steps: Math.floor(Math.random() * 8000 + 2000),
          sleepHours: Math.floor(Math.random() * 4 + 5),
          heartRate: Math.floor(Math.random() * 40 + 60),
        };
      }),
    [moodEntries]
  );

  const moodHealthData = useMemo(() => {
    return lineData.map((ld) => {
      const healthEntry = healthData.find((h) => h.date === ld.date) || {};
      return {
        ...ld,
        steps: healthEntry.steps || 0,
        sleepHours: healthEntry.sleepHours || 0,
        heartRate: healthEntry.heartRate || 0,
      };
    });
  }, [lineData, healthData]);

  // ===== Correlations =====
  const correlations = useMemo(() => {
    if (!moodHealthData.length) return null;

    const getCorrelation = (xKey, yKey) => {
      const n = moodHealthData.length;
      const x = moodHealthData.map((d) => d[xKey]);
      const y = moodHealthData.map((d) => d[yKey]);
      const meanX = x.reduce((a, b) => a + b, 0) / n;
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      const numerator = x.reduce(
        (sum, xi, idx) => sum + (xi - meanX) * (y[idx] - meanY),
        0
      );
      const denominator = Math.sqrt(
        x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) *
          y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
      );
      return denominator === 0 ? 0 : numerator / denominator;
    };

    return {
      moodSteps: getCorrelation("moodValue", "steps").toFixed(2),
      moodSleep: getCorrelation("moodValue", "sleepHours").toFixed(2),
      moodHeart: getCorrelation("moodValue", "heartRate").toFixed(2),
    };
  }, [moodHealthData]);

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
      {/* Calendar Heatmap */}
      <style>{`
        .color-empty { fill: #e5e7eb; }
        .color-level-1 { fill: #d1d5db; }
        .color-level-2 { fill: #a78bfa; }
        .color-level-3 { fill: #60a5fa; }
        .color-level-4 { fill: #facc15; }
        .color-level-5 { fill: #f87171; }
        .color-level-6 { fill: #4ade80; }
        .react-calendar-heatmap text { fill: ${textColor}; font-size: 10px; }
      `}</style>

      <h2
        className={`text-3xl font-bold mb-6 text-center ${
          theme === "dark" ? "text-purple-300" : "text-purple-700"
        }`}
      >
        📊 Mood Insights Dashboard
      </h2>

      {/* Mood Heatmap */}
      <div
        className="p-6 rounded-xl shadow-md mb-10"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          Mood Heatmap (Last 3 Months)
        </h3>
        <CalendarHeatmap
          startDate={new Date(new Date().setMonth(new Date().getMonth() - 3))}
          endDate={new Date()}
          values={heatmapData}
          classForValue={(value) => {
            if (!value) return "color-empty";
            if (value.count >= 6) return "color-level-6";
            if (value.count >= 5) return "color-level-5";
            if (value.count >= 4) return "color-level-4";
            if (value.count >= 3) return "color-level-3";
            if (value.count >= 2) return "color-level-2";
            return "color-level-1";
          }}
          tooltipDataAttrs={(value) => ({
            "data-tip": `${value.date} — ${value.count} journal entr${
              value.count > 1 ? "ies" : "y"
            }`,
          })}
        />
      </div>

      {/* Weekly Summary */}
      {weeklySummary && (
        <div
          className="p-6 rounded-xl shadow-md mb-10"
          style={{ backgroundColor: chartBg }}
        >
          <h3 className="text-lg font-semibold mb-3" style={{ color: textColor }}>
            Weekly Summary 🌈
          </h3>
          <p className="text-md mb-2" style={{ color: textColor }}>
            Dominant mood this week: <strong>{weeklySummary.dominantMood}</strong>
          </p>
          <p className="text-sm italic" style={{ color: textColor }}>
            {weeklySummary.message}
          </p>
        </div>
      )}

      {/* Mood Line Chart */}
      <div
        className="p-6 rounded-xl shadow-md mb-10"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          Mood Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={textColor} />
            <YAxis
              domain={[1, 6]}
              ticks={[1, 2, 3, 4, 5, 6]}
              stroke={textColor}
              tickFormatter={(val) =>
                Object.keys(moodScale).find((key) => moodScale[key] === val)
              }
            />
            <Tooltip
              contentStyle={{ backgroundColor: chartBg, color: textColor }}
              formatter={(val) =>
                Object.keys(moodScale).find((key) => moodScale[key] === val)
              }
            />
            <Line
              type="monotone"
              dataKey="moodValue"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div
        className="p-6 rounded-xl shadow-md mb-10"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          Mood Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name} ${value}%`}
            >
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[entry.name] || "#a3a3a3"} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ color: textColor }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Mood & Health Chart */}
      <div
        className="p-6 rounded-xl shadow-md mb-4"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          Mood & Physical Health Overview
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={moodHealthData}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={textColor} />
            <YAxis
              yAxisId="mood"
              domain={[1, 6]}
              ticks={[1, 2, 3, 4, 5, 6]}
              stroke={textColor}
              tickFormatter={(val) =>
                Object.keys(moodScale).find((key) => moodScale[key] === val)
              }
            />
            <YAxis yAxisId="steps" orientation="right" stroke="#10b981" />
            <YAxis yAxisId="sleep" orientation="right" stroke="#3b82f6" yAxisIdOffset={60} />
            <YAxis yAxisId="heart" orientation="right" stroke="#f97316" yAxisIdOffset={120} />
            <Tooltip
              contentStyle={{ backgroundColor: chartBg, color: textColor }}
              formatter={(val, name) =>
                name === "moodValue"
                  ? Object.keys(moodScale).find((key) => moodScale[key] === val)
                  : val
              }
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Line
              yAxisId="mood"
              type="monotone"
              dataKey="moodValue"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 5 }}
              name="Mood"
            />
            <Line
              yAxisId="steps"
              type="monotone"
              dataKey="steps"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Steps"
            />
            <Line
              yAxisId="sleep"
              type="monotone"
              dataKey="sleepHours"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Sleep (hrs)"
            />
            <Line
              yAxisId="heart"
              type="monotone"
              dataKey="heartRate"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Heart Rate (bpm)"
            />
          </LineChart>
        </ResponsiveContainer>

        {correlations && (
          <div className="mt-4 text-sm" style={{ color: textColor }}>
            <p>
              Correlation (Mood ↔ Steps): <strong>{correlations.moodSteps}</strong>
            </p>
            <p>
              Correlation (Mood ↔ Sleep): <strong>{correlations.moodSleep}</strong>
            </p>
            <p>
              Correlation (Mood ↔ Heart Rate): <strong>{correlations.moodHeart}</strong>
            </p>
            <p className="italic text-gray-500">
              *Values range from -1 (negative) to 1 (positive)
            </p>
          </div>
        )}
      </div>

      {/* Mind Map Placeholder */}
      <ReactFlowProvider>
        {/* Insert Mind Map component here */}
      </ReactFlowProvider>

      {/* Community Wall */}
      <div
        className="p-6 rounded-xl shadow-md mt-10 mb-10"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          🌐 Community Wall
        </h3>
        <textarea
          className="w-full p-2 mb-2 rounded border"
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
          className={`px-4 py-2 rounded ${
            posting
              ? "opacity-50 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white`}
          onClick={handlePost}
          disabled={posting}
        >
          {posting ? "Posting..." : "Post"}
        </button>

        {loadingPosts ? (
          <p className="mt-4" style={{ color: textColor }}>
            ⏳ Loading posts...
          </p>
        ) : (
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
            {communityPosts.map((post) => (
              <div
                key={post._id || post.id}
                className="p-3 rounded shadow"
                style={{
                  backgroundColor: theme === "dark" ? "#374151" : "#f3f4f6",
                  color: textColor,
                }}
              >
                <p>{post.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {communityPosts.length === 0 && (
              <p style={{ color: textColor }}>No posts yet. Be the first to share!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
