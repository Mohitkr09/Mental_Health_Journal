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
import { useJournal } from "../context/JournalContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Insights() {
  const { entries } = useJournal();
  const { theme } = useTheme();
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

  // Prepare line chart data
  const lineData =
    entries && entries.length
      ? entries
          .map((item) => ({
            date: new Date(item.date || item.createdAt).toLocaleDateString(),
            moodValue: moodScale[item.mood] || 0,
            moodLabel: item.mood || "neutral",
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      : [{ date: "No Data", moodValue: 0, moodLabel: "neutral" }];

  // Prepare pie chart data
  const moodCounts = entries.reduce((acc, item) => {
    acc[item.mood] = (acc[item.mood] || 0) + 1;
    return acc;
  }, {});

  const pieData =
    Object.keys(moodCounts).length > 0
      ? Object.keys(moodCounts).map((m) => ({ name: m, value: moodCounts[m] }))
      : [{ name: "No Data", value: 1 }];

  // Chart theme colors
  const chartBg = theme === "dark" ? "#1f2937" : "#ffffff";
  const textColor = theme === "dark" ? "#f3f4f6" : "#111827";
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";

  useEffect(() => setLoading(false), []);

  if (loading)
    return <p className="text-center text-gray-500 mt-8">⏳ Loading insights...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

  return (
    <div
      className={`max-w-5xl mx-auto px-4 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-purple-50"
      }`}
    >
      <h2
        className={`text-3xl font-bold mb-6 text-center transition-colors duration-300 ${
          theme === "dark" ? "text-purple-300" : "text-purple-700"
        }`}
      >
        📊 Mood Insights
      </h2>

      {/* === Line Chart === */}
      <div
        className="p-6 rounded-xl shadow-md mb-10 transition-colors duration-300"
        style={{ backgroundColor: chartBg, minHeight: 350 }}
      >
        <h3
          className="text-lg font-semibold mb-4 transition-colors duration-300"
          style={{ color: textColor }}
        >
          Mood Over Time
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={textColor} />
              <YAxis
                domain={[0, 6]}
                ticks={[1, 2, 3, 4, 5, 6]}
                stroke={textColor}
                tickFormatter={(val) =>
                  Object.keys(moodScale).find((k) => moodScale[k] === val)
                }
              />
              <Tooltip
                contentStyle={{ backgroundColor: chartBg, color: textColor }}
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
        </div>
      </div>

      {/* === Pie Chart === */}
      <div
        className="p-6 rounded-xl shadow-md transition-colors duration-300"
        style={{ backgroundColor: chartBg, minHeight: 350 }}
      >
        <h3
          className="text-lg font-semibold mb-4 transition-colors duration-300"
          style={{ color: textColor }}
        >
          Mood Distribution
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#a3a3a3"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: chartBg, color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
