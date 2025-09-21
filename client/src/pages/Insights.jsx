// src/pages/Insights.jsx
import { useEffect, useState } from "react";
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
} from "recharts";
import { useJournal } from "../context/JournalContext.jsx"; // ✅ use context

export default function Insights() {
  const { entries } = useJournal(); // ✅ get journal entries from context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // ✅ Prepare chart data
  const lineData = entries
    .map((item) => ({
      date: new Date(item.date || item.createdAt).toLocaleDateString(),
      moodValue: moodScale[item.mood] || 0,
      moodLabel: item.mood,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const moodCounts = entries.reduce((acc, item) => {
    acc[item.mood] = (acc[item.mood] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(moodCounts).map((m) => ({
    name: m,
    value: moodCounts[m],
  }));

  // ✅ Simulate loading
  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <p className="text-center text-gray-500 mt-8">⏳ Loading insights...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">
        📊 Mood Insights
      </h2>

      {/* === Line Chart: Mood Over Time === */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-10">
        <h3 className="text-lg font-semibold mb-4">Mood Over Time</h3>
        {lineData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                domain={[0, 6]}
                ticks={[1, 2, 3, 4, 5, 6]}
                tickFormatter={(val) =>
                  Object.keys(moodScale).find((k) => moodScale[k] === val)
                }
              />
              <Tooltip
                formatter={(val) =>
                  Object.keys(moodScale).find((k) => moodScale[k] === val)
                }
              />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400">No mood entries yet.</p>
        )}
      </div>

      {/* === Pie Chart: Mood Distribution === */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
        {pieData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || "#a3a3a3"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400">No mood data to show.</p>
        )}
      </div>
    </div>
  );
}
