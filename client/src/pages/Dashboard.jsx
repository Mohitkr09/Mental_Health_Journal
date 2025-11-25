// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/schedule/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // map to chart-friendly items
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
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Weekly Wellness Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
          <h3 className="mb-2 text-sm font-medium">Adherence (Completed tasks)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#7c3aed" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
          <h3 className="mb-2 text-sm font-medium">Adherence %</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="adherence" stroke="#7c3aed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
