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

  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("");

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Prevent saving to localStorage until we've hydrated from it
  const hydratedRef = useRef(false);

  const KEEP_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

  // -------------------------
  // DEBUG: log storage & state (optional, remove later)
  useEffect(() => {
    console.log("🟡 localStorage(journals):", localStorage.getItem("journals"));
    console.log("🟣 React State(journals):", journals);
  }, [journals]);

  // ---------------------------------------------------------
  // 1) Hydrate from localStorage ONCE (fast UI)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("journals");
      if (cached) {
        const parsed = JSON.parse(cached);
        setJournals(parsed);
        console.log("📥 Hydrated journals from localStorage:", parsed.length);
      } else {
        console.log("❗ No journals in localStorage");
      }
    } catch (err) {
      console.warn("⚠️ Failed to parse cached journals:", err);
    } finally {
      // mark hydrated so subsequent changes persist to storage
      hydratedRef.current = true;
    }
  }, []);

  // ---------------------------------------------------------
  // 2) Persist to localStorage — but ONLY after hydration
  useEffect(() => {
    if (!hydratedRef.current) {
      // skip initial writes before we loaded cached data
      return;
    }
    try {
      localStorage.setItem("journals", JSON.stringify(journals));
      // small debug:
      // console.log("💾 Saved journals to localStorage:", journals.length);
    } catch (err) {
      console.error("❌ Failed to save journals to localStorage:", err);
    }
  }, [journals]);

  // ---------------------------------------------------------
  // 3) Fetch backend and MERGE with current state safely
  useEffect(() => {
    const fetchAndMerge = async () => {
      const token = localStorage.getItem("token");
      if (!token || token === "null") {
        // do not navigate aggressively if you want offline-first behavior.
        // For now, we return early to avoid redirect races.
        console.log("❌ No token found — skipping backend fetch");
        return;
      }

      try {
        const res = await api.get("/journal");
        const backendList = Array.isArray(res.data)
          ? res.data
          : res.data?.journals ?? res.data?.data ?? res.data?.items ?? [];

        console.log("🌐 Backend returned", backendList.length, "entries");

        const now = Date.now();
        const backendRecent = backendList.filter(
          (it) => now - new Date(it.createdAt).getTime() <= KEEP_MS
        );

        // Use current React state as local set (avoid re-reading localStorage which might be overwritten elsewhere)
        const localCurrent = journals || [];

        // Merge backendRecent (prefer server entries) with local entries not present on server
        const merged = [
          // Keep server entries first (dedup by _id)
          ...backendRecent,
          // Append local entries that server doesn't have
          ...localCurrent.filter((loc) => !backendRecent.some((b) => b._id === loc._id)),
        ];

        // If merged is empty but we have localCurrent, keep localCurrent (prevents server-empty wiping)
        const final = merged.length > 0 ? merged : localCurrent;

        setJournals(final);

        // Ensure persisted storage (we guard save by hydratedRef so it's safe)
        if (hydratedRef.current) {
          try {
            localStorage.setItem("journals", JSON.stringify(final));
          } catch (err) {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch backend journals — keeping local cache", err);
        // keep local journals (no-op)
      }
    };

    // Run fetch after a small microtask to let initial hydration settle
    // (helps avoid edge timing issues)
    const t = setTimeout(fetchAndMerge, 50);
    return () => clearTimeout(t);
  }, [/* intentionally no dependency on journals to avoid loop */, navigate]);

  // ---------------------------------------------------------
  // Prepare chart data (last 30 days, oldest->newest)
  const chartData = journals
    .slice()
    .filter((e) => Date.now() - new Date(e.createdAt).getTime() <= KEEP_MS)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString(),
      mood: entry.mood || "neutral",
      value: moodToValue(entry.mood),
    }));

  // ---------------------------------------------------------
  // Build Chart.js graph
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy();
      } catch (e) {
        /* ignore */
      }
      chartInstanceRef.current = null;
    }

    if (!chartData || chartData.length < 2) return;

    let isMounted = true;
    (async () => {
      try {
        const ChartModule = await import("chart.js/auto");
        const Chart = ChartModule.default ?? ChartModule.Chart ?? ChartModule;
        if (!isMounted) return;

        const ctx = chartRef.current.getContext("2d");
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
              },
              x: { grid: { display: false } },
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
        console.error("❌ Chart init error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy();
        } catch (e) {}
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, theme]);

  // ---------------------------------------------------------
  // Create new journal entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/journal", { text, mood });
      const newEntry = res.data?.journal || res.data;

      // update state using functional update to avoid stale closure
      setJournals((prev) => {
        const now = Date.now();
        const updated = [newEntry, ...prev].filter(
          (it) => now - new Date(it.createdAt).getTime() <= KEEP_MS
        );
        return updated;
      });

      setText("");
      setMood("");
    } catch (err) {
      console.error("❌ Error saving journal:", err);
      setError("Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Edit an entry
  const handleEdit = async (id, updatedText) => {
    try {
      const res = await api.put(`/journal/${id}`, { text: updatedText });
      const updated = res.data?.journal || res.data;
      setJournals((prev) => prev.map((j) => (j._id === id ? updated : j)));
    } catch (err) {
      console.error("❌ Edit error:", err);
    }
  };

  // ---------------------------------------------------------
  // Delete an entry
  const handleDelete = async (id) => {
    try {
      await api.delete(`/journal/${id}`);
      setJournals((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  // ---------------------------------------------------------
  // Group entries by date for rendering
  const groupedEntries = journals.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const filteredEntries = Object.entries(groupedEntries).map(([date, entries]) => [
    date,
    entries.filter(
      (e) =>
        (!filterMood || e.mood === filterMood) &&
        e.text.toLowerCase().includes(search.toLowerCase())
    ),
  ]);

  // ---------------------------------------------------------
  const pageBg = theme === "dark" ? "bg-gray-900" : "bg-purple-50";
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-300";
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-900";

  return (
    <div className={`${pageBg} p-6 min-h-screen`}>
      <h1 className={`text-2xl font-bold mb-4 ${textColor}`}>My Journal</h1>

      {/* Graph */}
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
          <p className="text-gray-400">Not enough data to show graph.</p>
        )}
      </div>

      {/* Form */}
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

      {/* Filters */}
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

      {/* Entries */}
      {filteredEntries.map(([date, entries]) =>
        entries.length > 0 ? (
          <div key={date} className="mb-6">
            <h2 className={`text-lg font-bold mb-3 ${textColor}`}>{date}</h2>
            {entries.map((entry) => (
              <div key={entry._id} className={`${cardBg} border ${borderColor} p-4 rounded-lg mb-3`}>
                <p className={textColor}>{entry.text}</p>
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
