// src/pages/Journal.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Journal() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [journals, setJournals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);

  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("");

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Keep only entries from last 30 days
  const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

  // Utility: map mood to numeric value for chart
  const moodToValue = (m) =>
    m === "happy" ? 4 : m === "neutral" ? 3 : m === "anxious" ? 2 : m === "sad" ? 1 : 0;

  const moodColors = {
    happy: "#4ade80",
    neutral: "#9CA3AF",
    anxious: "#FB923C",
    sad: "#60A5FA",
    angry: "#EF4444",
    tired: "#A78BFA",
  };

  // Fetch journals + profile on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token || token === "null") {
        setJournals([]);
        navigate("/login");
        return;
      }

      try {
        const journalRes = await api.get("/journal");
        // normalize response shape
        const list = Array.isArray(journalRes.data)
          ? journalRes.data
          : journalRes.data?.journals ||
            journalRes.data?.data ||
            journalRes.data?.items ||
            [];

        // keep only last 30 days (server may already do this; this ensures front-end remains consistent)
        const now = Date.now();
        const recent = list.filter((item) => now - new Date(item.createdAt).getTime() <= KEEP_MS);

        setJournals(recent);

        // profile data
        const userRes = await api.get("/users/profile");
        setStreak(userRes.data.streak || 0);
        setBadges(userRes.data.badges || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("⚠️ Failed to load journals. Please try again.");
        }
      }
    };

    fetchData();

  }, [navigate]);

  // Prepare chartData from last 30 days and sorted oldest->newest
  const chartData = journals
    .slice()
    .filter((e) => {
      return Date.now() - new Date(e.createdAt).getTime() <= KEEP_MS;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString(),
      mood: entry.mood || "neutral",
      value: moodToValue(entry.mood),
    }));

  // Build chart using dynamic import to avoid Chart.js class instantiation issues in some bundlers
  useEffect(() => {
    // no canvas or no data -> do nothing (destroy existing chart if present)
    if (!chartRef.current) return;
    if (chartInstanceRef.current) {
      // destroy previous
      try {
        chartInstanceRef.current.destroy();
      } catch (e) {
        // ignore
      }
      chartInstanceRef.current = null;
    }

    if (!chartData || chartData.length < 2) return;

    let isMounted = true;

    (async () => {
      try {
        // dynamic import
        const ChartModule = await import("chart.js/auto");
        const Chart = ChartModule.default ?? ChartModule.Chart ?? ChartModule;

        if (!isMounted) return;

        const ctx = chartRef.current.getContext("2d");

        // Build gradient for line as a subtle background (optional)
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(139,92,246,0.15)");
        gradient.addColorStop(1, "rgba(139,92,246,0.02)");

        chartInstanceRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: chartData.map((d) => d.date),
            datasets: [
              {
                label: "Mood",
                data: chartData.map((d) => d.value),
                fill: true,
                backgroundColor: gradient,
                borderWidth: 3,
                borderColor: "#8b5cf6",
                pointBackgroundColor: chartData.map((d) => moodColors[d.mood] || "#8b5cf6"),
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.35,
                // segment coloring: color segment by starting point mood
                segment: {
                  borderColor: (ctx) => {
                    const i = ctx.p0DataIndex;
                    return moodColors[chartData[i]?.mood] || "#8b5cf6";
                  },
                },
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 4,
                ticks: {
                  stepSize: 1,
                  callback: (v) =>
                    v === 4
                      ? "Happy"
                      : v === 3
                      ? "Neutral"
                      : v === 2
                      ? "Anxious"
                      : v === 1
                      ? "Sad"
                      : "",
                },
                grid: {
                  color: theme === "dark" ? "#444" : "#eee",
                },
              },
              x: {
                grid: { display: false },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const idx = ctx.dataIndex;
                    const point = chartData[idx];
                    return point ? `${point.mood} (${point.value})` : ctx.formattedValue;
                  },
                },
              },
            },
          },
        });
      } catch (err) {
        console.error("Chart init error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy();
        } catch (e) {
          // noop
        }
        chartInstanceRef.current = null;
      }
    };
    // rebuild when chartData or theme changes
  }, [chartData, theme]);

  // Create new journal entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/journal", { text, mood });

      const newEntry = res.data?.journal || res.data?.data || res.data?.entry || res.data;

      // Append and prune older than 30 days locally:
      const updated = [newEntry, ...journals];
      const now = Date.now();
      const pruned = updated.filter((it) => now - new Date(it.createdAt).getTime() <= KEEP_MS);

      setJournals(pruned);
      setText("");
      setMood("");

      if (res.data.streak !== undefined) setStreak(res.data.streak);
      if (res.data.badges) setBadges(res.data.badges);
    } catch (err) {
      console.error("Error saving journal:", err);
      setError("⚠️ Failed to save journal entry.");
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit entry
  const handleEdit = async (id, updatedText) => {
    try {
      const res = await api.put(`/journal/${id}`, { text: updatedText });
      const updated = res.data?.journal || res.data?.data || res.data;
      setJournals(journals.map((j) => (j._id === id ? updated : j)));
    } catch (err) {
      console.error("Error editing entry:", err);
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    try {
      await api.delete(`/journal/${id}`);
      setJournals(journals.filter((j) => j._id !== id));
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  // Group entries by date for listing
  const groupedEntries = journals.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const filteredEntries = Object.entries(groupedEntries).map(([date, entries]) => [
    date,
    entries.filter(
      (e) => (!filterMood || e.mood === filterMood) && e.text.toLowerCase().includes(search.toLowerCase())
    ),
  ]);

  // Theme classes
  const pageBg = theme === "dark" ? "bg-gray-900" : "bg-purple-50";
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-300";
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-900";

  return (
    <div className={`${pageBg} p-6 min-h-screen`}>
      <h1 className={`text-2xl font-bold mb-4 ${textColor}`}>My Journal</h1>

      {/* Demo image — using the uploaded container path; your environment/tooling will convert this to a URL */}
      <div className="mb-6">
        <img
          src="/mnt/data/b3f806a1-cbc2-403e-8170-b0363f1b36bc.png"
          alt="debug"
          className="w-28 h-28 object-cover rounded-lg shadow"
        />
      </div>

      {/* MOOD GRAPH CARD */}
      <div className={`${cardBg} border ${borderColor} p-4 rounded-lg shadow mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold ${textColor}`}>Mood Trend (Last 30 days)</h2>
          <div className="text-sm text-gray-500">Points colored by mood</div>
        </div>

        {chartData.length > 1 ? (
          <div style={{ height: 220 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        ) : (
          <p className="text-gray-400">Not enough data to show graph (need at least 2 entries).</p>
        )}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <textarea
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your thoughts..."
          className={`w-full p-3 rounded-lg border ${borderColor} ${cardBg} ${textColor}`}
          required
        />

        <div className="flex gap-3 flex-wrap">
          {["happy", "sad", "anxious", "neutral", "tired", "angry"].map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-lg border ${
                mood === m ? "bg-purple-600 text-white" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          {loading ? "Saving..." : "Save Entry"}
        </button>
      </form>

      {/* FILTERS */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded-lg border"
        />

        <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)} className="p-2 rounded-lg border">
          <option value="">All moods</option>
          <option value="happy">Happy</option>
          <option value="sad">Sad</option>
          <option value="anxious">Anxious</option>
          <option value="neutral">Neutral</option>
          <option value="tired">Tired</option>
          <option value="angry">Angry</option>
        </select>
      </div>

      {/* JOURNAL ENTRIES */}
      {filteredEntries.map(([date, entries]) =>
        entries.length > 0 ? (
          <div key={date} className="mb-6">
            <h2 className={`text-lg font-bold mb-3 ${textColor}`}>{date}</h2>

            {entries.map((entry) => (
              <div key={entry._id} className={`${cardBg} border ${borderColor} p-4 rounded-lg mb-3`}>
                <p className={`${textColor}`}>{entry.text}</p>
                <p className="text-sm mt-1 text-gray-500">Mood: {entry.mood}</p>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      const newText = prompt("Edit entry:", entry.text);
                      if (newText) handleEdit(entry._id, newText);
                    }}
                    className="text-blue-500 text-sm"
                  >
                    Edit
                  </button>

                  <button onClick={() => handleDelete(entry._id)} className="text-red-500 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
