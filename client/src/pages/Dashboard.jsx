// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/schedule/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const d = res.data.data.map((r) => ({
          date: r.date.slice(5), // MM-DD
          completed: r.completed,
          total: r.total,
          adherence: r.total ? Math.round((r.completed / r.total) * 100) : 0,
        }));
        setData(d);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-200 transition-all">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h2 className="text-3xl font-extrabold text-center mb-8">
          📊 Wellness Performance Dashboard
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
          Track your weekly progress, habit strength, and consistency over time.
        </p>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeInUp">
          {/* Bar Chart */}
          <div className="p-5 rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-lg font-semibold">
                Tasks Completed Per Day
              </h3>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    border: "none",
                    color: "white",
                  }}
                />
                <Bar
                  dataKey="completed"
                  fill="url(#colorCompleted)"
                  name="Completed Tasks"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="p-5 rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-semibold">Daily Adherence %</h3>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis domain={[0, 100]} stroke="#aaa" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    border: "none",
                    color: "white",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#9333ea" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Box */}
        <div className="mt-12 p-6 bg-purple-600 text-white rounded-3xl shadow-lg text-center">
          <h3 className="text-xl font-semibold mb-2">✨ Weekly Insight</h3>
          <p>
            Your most productive days trend toward mid-week. Aim to keep this
            streak alive by maintaining your current rhythm!
          </p>
        </div>
      </div>
    </div>
  );
}
