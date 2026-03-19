import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays } from "date-fns";

import DailyMoodPopup from "../components/DailyMoodPopup.jsx";
import api from "../utils/api.js";

import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

import qrcode from "../assets/qrcode.png";

export default function Home() {
  const navigate = useNavigate();
  const { journals } = useJournal();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [schedule, setSchedule] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  /* ================= SCORE ================= */
  const mentalScore = useMemo(() => {
    let score = 50;
    journals?.forEach((j) => {
      if (j.mood === "happy") score += 2;
      if (j.mood === "neutral") score += 1;
      if (j.mood === "anxious") score -= 1;
      if (j.mood === "sad") score -= 2;
    });
    return Math.max(0, Math.min(100, score));
  }, [journals]);

  /* ================= HEATMAP ================= */
  const heatmapData =
    journals?.map((j) => ({
      date: new Date(j.createdAt || j.date).toISOString().slice(0, 10),
      count: 1,
    })) || [];

  /* ================= WEEKLY ================= */
  const weeklyReport = useMemo(() => {
    const moods = {};
    journals?.slice(0, 7).forEach((j) => {
      moods[j.mood] = (moods[j.mood] || 0) + 1;
    });
    return moods;
  }, [journals]);

  /* ================= AFFIRMATION ================= */
  const affirmations = [
    "You are stronger than your thoughts.",
    "Progress is progress, no matter how small.",
    "You deserve peace and happiness.",
    "Your feelings are valid.",
    "Every day is a new beginning.",
  ];

  const affirmation = useMemo(
    () => affirmations[Math.floor(Math.random() * affirmations.length)],
    []
  );

  /* ================= GREETING ================= */
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 18) return "Good Afternoon 🌤";
    return "Good Evening 🌙";
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;
      try {
        const res = await api.get("/schedule");
        setSchedule(res.data);
      } catch {}
    };
    fetchSchedule();
  }, [user]);

  const timelineItems = useMemo(() => {
    return (schedule?.items || []).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  }, [schedule]);

  const toggleComplete = (task) => {
    const key = `${task.time}_${task.title}`;
    setCompletedMap((prev) => ({ ...prev, [key]: true }));
  };

  /* ================= STYLES ================= */
  const glass =
    "bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 " +
    "shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl transition-all duration-300 " +
    "hover:shadow-[0_10px_40px_rgba(124,58,237,0.25)] hover:-translate-y-1 hover:scale-[1.02]";

  const buttonGlow =
    "relative overflow-hidden px-6 py-4 rounded-2xl text-white font-medium " +
    "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg transition " +
    "hover:scale-105 active:scale-95";

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-purple-50 via-white to-indigo-50"
      }`}
    >
      {/* 🌈 FLOATING BACKGROUND */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-52 h-52 bg-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-300/20 rounded-full blur-3xl animate-bounce"></div>

      {user && <DailyMoodPopup onMoodSelect={() => {}} />}

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-14 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">
          {greeting()}, {user?.name || "Friend"}
        </h1>

        <p className="mt-3 text-gray-500 text-lg">
          Your mental wellness dashboard
        </p>

        {/* 🧠 BREATHING ANIMATION */}
        <div className="flex justify-center mt-10">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute w-full h-full rounded-full bg-purple-400/30 animate-ping"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse shadow-xl"></div>
          </div>
        </div>

        {/* FLOATING IMAGE */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/3209/3209265.png"
          className="w-36 mx-auto mt-6 animate-[float_6s_ease-in-out_infinite] drop-shadow-2xl"
        />
      </section>

      {/* DASHBOARD */}
      <section className="max-w-7xl mx-auto px-6 mt-14 grid md:grid-cols-4 gap-6">
        <div className={`${glass} p-6`}>
          <p className="text-sm opacity-70">Mental Score</p>
          <p className="text-3xl font-bold mt-2">{mentalScore}/100</p>
          <div className="w-full bg-white/30 h-2 mt-4 rounded-full">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
              style={{ width: `${mentalScore}%` }}
            />
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <p className="text-sm opacity-70">Mood</p>
          <p className="text-xl mt-2">{schedule?.mood || "Not set"}</p>
        </div>

        <div className={`${glass} p-6`}>
          <p className="text-sm opacity-70">Stress</p>
          <p className="text-xl mt-2">{schedule?.stressScore || "--"}</p>
        </div>

        <div className={`${glass} p-6`}>
          <p className="text-sm opacity-70">Sleep Tip</p>
          <p className="text-sm mt-2">
            {schedule?.sleepTip || "7-9 hours recommended"}
          </p>
        </div>
      </section>

      {/* AFFIRMATION */}
      <section className="max-w-4xl mx-auto mt-14 px-6">
        <div className="relative p-10 rounded-3xl overflow-hidden text-center shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90"></div>
          <div className="relative z-10 text-white">
            <h3 className="text-xl font-semibold">Daily Affirmation</h3>
            <p className="mt-4 text-lg italic">"{affirmation}"</p>
          </div>
        </div>
      </section>

      {/* HEATMAP */}
      <section className="max-w-6xl mx-auto mt-14 px-6">
        <h2 className="text-xl font-semibold mb-4">Mood Activity</h2>
        <div className={`${glass} p-6`}>
          <CalendarHeatmap
            startDate={subDays(new Date(), 120)}
            endDate={new Date()}
            values={heatmapData}
          />
        </div>
      </section>

      {/* WEEKLY */}
      <section className="max-w-6xl mx-auto mt-14 px-6">
        <h2 className="text-xl font-semibold mb-4">Weekly Report</h2>
        <div className={`${glass} p-6`}>
          {Object.entries(weeklyReport).map(([mood, count]) => (
            <div
              key={mood}
              className="flex justify-between py-2 border-b border-white/20 hover:bg-white/10 px-2 rounded transition"
            >
              <span className="capitalize">{mood}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIONS */}
      <section className="max-w-4xl mx-auto mt-14 px-6 grid sm:grid-cols-2 gap-6">
        <button onClick={() => navigate("/journal")} className={buttonGlow}>
          ✍️ Write Journal
        </button>

        <button onClick={() => navigate("/chat")} className={buttonGlow}>
          🤖 Talk with AI
        </button>
      </section>

      {/* TIMELINE */}
      <section className="max-w-5xl mx-auto mt-16 px-6">
        <h2 className="text-2xl font-bold mb-6">Today's Timeline</h2>

        <div className="space-y-6 border-l-2 border-purple-500 pl-6">
          {timelineItems.map((item) => {
            const key = `${item.time}_${item.title}`;
            const completed = completedMap[key];

            return (
              <div key={key}>
                <div className={`${glass} p-5`}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm opacity-60">{item.time}</p>

                  <button
                    onClick={() => toggleComplete(item)}
                    className="mt-3 text-xs px-3 py-1 bg-purple-600 text-white rounded hover:scale-105 transition"
                  >
                    {completed ? "Completed" : "Mark Done"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className={`${glass} mt-20 p-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10`}>
        <div>
          <h3 className="text-3xl font-bold">Download MindCare</h3>
          <p className="text-gray-500 mt-3">
            Access your journal anytime anywhere.
          </p>
        </div>
        <img src={qrcode} className="w-32 hover:scale-110 transition" />
      </section>

      {/* FOOTER */}
      <footer className="mt-20 text-center text-gray-500 pb-6">
        © {new Date().getFullYear()} MindCare
      </footer>
    </div>
  );
}