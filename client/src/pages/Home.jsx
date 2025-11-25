// src/pages/Home.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import DailyMoodPopup from "../components/DailyMoodPopup.jsx";
import DailySchedule from "../components/DailySchedule.jsx";
import axios from "axios";

import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

import qrcode from "../assets/qrcode.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


export default function Home() {
  const { addEntry } = useJournal();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Cookie consent
  const [showCookie, setShowCookie] = useState(true);
  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent) setShowCookie(false);
  }, []);
  const handleConsent = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowCookie(false);
  };

  // Schedule state
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Timeline UI toggle
  const [showTimeline, setShowTimeline] = useState(true);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("notificationsEnabled") === "true"
  );
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const notificationIntervalRef = useRef(null);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);

  // Dashboard stats
  const [completedMap, setCompletedMap] = useState({}); // { time_taskId: true }
  const completedCount = useMemo(
    () =>
      Object.values(completedMap).filter(Boolean).length,
    [completedMap]
  );

  // Helpful tips for notifications (rotate)
  const wellnessTips = [
    "Take 3 deep breaths—box breathing for 1 minute helps reset stress.",
    "Stand up and stretch for 2 minutes — move your shoulders, neck and spine.",
    "Drink a glass of water — hydration helps mood & concentration.",
    "Try a quick 3-minute grounding exercise: name 5 things you see.",
    "Schedule 10 minutes for journaling tonight to reflect on wins.",
  ];

  // Debug file from developer (uploaded file path) — include as dev link
  const debugAudioLocalPath = "/mnt/data/debug_audio.wav"; // developer-specified local file path

  // Fetch today's schedule (if user is logged in)
  const fetchSchedule = async () => {
    if (!user) return;
    setLoadingSchedule(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/schedule`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // backend may return null
      setSchedule(res.data || null);
      // generate recommendations from whatever schedule we have
      setRecommendations(generateRecommendations(res.data?.mood || null, res.data));
    } catch (err) {
      // no schedule yet is fine
      console.log("No schedule yet", err?.response?.data || "");
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // cleanup on unmount
    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Generate schedule from backend
  const generateSchedule = async (mood) => {
    if (!user) {
      alert("Please log in to generate schedule");
      return;
    }
    try {
      setLoadingSchedule(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/schedule`,
        { mood },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSchedule(res.data);
      setRecommendations(generateRecommendations(mood, res.data));
      // show an in-app notification that schedule created
      showInAppNotification(`Today's schedule created for "${mood}"`);
    } catch (err) {
      console.error("Failed to generate schedule:", err);
      alert("Unable to generate schedule. See console.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Called from DailyMoodPopup automatically
  const handleMoodSelected = async (mood) => {
    // Save quick journal entry and then generate schedule
    try {
      await addEntry({
        text: `Daily quick log: Feeling ${mood} today.`,
        mood,
        date: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not save quick entry:", e);
    }
    generateSchedule(mood);
  };

  // ===== Notifications =====
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  const showBrowserNotification = async (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    } else {
      // Try to request permission and then show if granted
      const ok = await requestNotificationPermission();
      if (ok) new Notification(title, { body });
    }
  };

  const showInAppNotification = (text) => {
    setShowNotificationPopup(true);
    // auto-hide
    setTimeout(() => setShowNotificationPopup(false), 4500);
  };

  // Toggle notifications (persisted)
  const toggleNotifications = async () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem("notificationsEnabled", newVal ? "true" : "false");

    if (newVal) {
      // ask permission
      await requestNotificationPermission();
      // start interval to show random tip every 3 hours (demo: 60s)
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
      // for demo, use 60*60*1000 (1 hour). Lower for dev testing
      notificationIntervalRef.current = setInterval(() => {
        const tip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
        showBrowserNotification("MindCare Reminder", tip);
        showInAppNotification(tip);
      }, 60 * 60 * 1000); // production: every hour
      // fire one immediately
      const tip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
      showBrowserNotification("MindCare Reminder", tip);
      showInAppNotification(tip);
    } else {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
    }
  };

  // ===== Timeline helpers =====
  const getTimelineItems = (scheduleObj) => {
    const items = scheduleObj?.items || scheduleObj?.tasks || [];
    // Normalize: if backend uses {time, title, description} convert to {time, title, description}
    const normalized = items.map((it, idx) => {
      // Some backends might use {title, time, description} or {task, time}
      return {
        id: it._id || it.id || `${it.time || "t"}-${idx}`,
        time: it.time || it.start || "",
        title: it.title || it.task || it.name || "Untitled",
        description: it.description || it.desc || "",
        durationMins: it.durationMins || null,
        type: it.type || "general",
      };
    });
    // sort by time if time exists (HH:MM)
    normalized.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    return normalized;
  };

  const timelineItems = useMemo(() => getTimelineItems(schedule), [schedule]);

  // Mark task complete (local)
  const toggleComplete = (task) => {
    const key = `${task.time}_${task.title}`;
    setCompletedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== AI Recommendations (local mock) =====
  function generateRecommendations(mood, scheduleObj) {
    // Lightweight local rules — replace with backend call/AI later
    const recs = [];
    if (!mood && scheduleObj?.mood) mood = scheduleObj.mood;

    if (!mood) {
      recs.push({
        title: "Keep a simple habit",
        text: "Try journaling for 3 minutes at the end of the day — note one positive and one challenge.",
      });
      return recs;
    }

    switch (mood) {
      case "anxious":
        recs.push(
          { title: "Micro-breathing", text: "Box breathe: 4s in, hold 4s, 4s out — repeat 4 times." },
          { title: "Grounding", text: "Use 5-4-3-2-1: name 5 things you see, 4 you can touch..." },
          { title: "Sleep tip", text: "Avoid screens 30 min before bed — try warm drink or reading." }
        );
        break;
      case "sad":
        recs.push(
          { title: "Gentle activation", text: "Try a 10-minute slow walk or light stretching to lift energy." },
          { title: "Reach out", text: "Message a trusted friend or schedule a short call." }
        );
        break;
      case "tired":
        recs.push(
          { title: "Prioritize sleep", text: "Aim for consistent sleep times — wind down 60 minutes before bed." },
          { title: "Nap smart", text: "If napping, keep it <= 20 minutes and not too late in the day." }
        );
        break;
      case "angry":
        recs.push(
          { title: "Energy release", text: "Try 5–10 minutes of vigorous movement like fast walking or jumping jacks." },
          { title: "Delay reaction", text: "Pause and breathe before responding; use 'I'll get back to you' when needed." }
        );
        break;
      case "happy":
        recs.push(
          { title: "Amplify wellbeing", text: "Write 3 things you’re grateful for — share one with someone." },
          { title: "Share joy", text: "Consider helping someone — small acts increase connection." }
        );
        break;
      default:
        recs.push(
          { title: "Balanced day", text: "Stay hydrated, choose a protein-packed breakfast and a midday walk." }
        );
    }

    // Add schedule-based quick tips
    const tasks = (scheduleObj?.items || scheduleObj?.tasks || []).slice(0, 3);
    if (tasks.length) {
      recs.push({ title: "Quick wins", text: `Try completing: ${tasks.map(t => t.title || t.task || t.name).slice(0,3).join(", ")}` });
    }

    return recs;
  }

  // Close notification popup early
  const dismissInAppNotification = () => setShowNotificationPopup(false);

  // UI — small helper to render timeline node style
  const TimelineItem = ({ item }) => {
    const key = `${item.time}_${item.title}`;
    const completed = !!completedMap[key];
    return (
      <div className="flex gap-3 items-start">
        <div className="mt-1">
          <div className={`w-3 h-3 rounded-full ${completed ? "bg-green-500" : "bg-purple-500"}`} />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <p className={`font-semibold text-sm ${completed ? "line-through text-gray-400" : ""}`}>{item.title}</p>
              {item.description && <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{item.time || "—"}</span>
              <button
                onClick={() => toggleComplete(item)}
                className={`px-2 py-1 text-xs rounded ${completed ? "bg-gray-200 dark:bg-gray-700" : "bg-purple-600 text-white"}`}
              >
                {completed ? "Undo" : "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900"
      }`}
    >
      {/* Daily Mood Popup (auto triggers schedule generation via onMoodSelect) */}
      {user && <DailyMoodPopup onMoodSelect={handleMoodSelected} />}

      {/* Small in-app notification popup */}
      {showNotificationPopup && (
        <div
          className="fixed right-4 top-20 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-80 border dark:border-gray-700"
          role="status"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold">MindCare</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">A gentle reminder to care for yourself.</p>
            </div>
            <button onClick={dismissInAppNotification} className="text-xs text-gray-500">Close</button>
          </div>
        </div>
      )}

      <main className="flex flex-col items-center flex-1 text-center px-4 sm:px-6 lg:px-12 py-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-snug sm:leading-tight mt-6">
          Welcome to{" "}
          <span className="text-purple-600 dark:text-purple-400">MindCare</span>{" "}
          ✨
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl max-w-xl sm:max-w-2xl">
          Your private AI-enhanced journaling guide to heal, grow, and flourish.
        </p>

        {/* Top controls row: notifications toggle + small dashboard */}
        <div className="w-full max-w-6xl mt-8 flex flex-col md:flex-row gap-4 items-stretch">
          {/* Left: Dashboard */}
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Mood</p>
                <p className="text-lg font-semibold">{(schedule && schedule.mood) ? schedule.mood : "Not set"}</p>
              </div>

              <div className="flex flex-col items-end">
                <p className="text-sm text-gray-500">Tasks done</p>
                <p className="text-lg font-semibold">{completedCount}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Sleep suggestion</p>
                <p className="text-sm font-medium mt-1">{schedule?.sleepTip ?? "Aim 7-9 hours"}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Stress score</p>
                <p className="text-sm font-medium mt-1">{schedule?.stressScore ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Right: Notification & small actions */}
          <div className="w-80 md:w-64 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border dark:border-gray-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              <button
                onClick={toggleNotifications}
                className={`px-3 py-1 rounded-full text-xs ${notificationsEnabled ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                {notificationsEnabled ? "On" : "Off"}
              </button>
            </div>

            <p className="text-xs text-gray-500">Receive gentle reminders and tips during the day.</p>

            <button
              onClick={() => {
                // quick tip trigger
                const tip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
                showBrowserNotification("MindCare Tip", tip);
                showInAppNotification(tip);
              }}
              className="mt-2 px-3 py-2 bg-purple-600 text-white rounded text-sm"
            >
              Show quick tip
            </button>

            {/* DEV: link to debug audio file uploaded during testing */}
            <div className="mt-2 text-xs text-gray-400">
              Dev file:{" "}
              <a href={debugAudioLocalPath} className="underline text-purple-600" target="_blank" rel="noreferrer">
                debug_audio.wav
              </a>
            </div>
          </div>
        </div>

        {/* DAILY SCHEDULE SECTION */}
        <section className="w-full max-w-4xl mt-8 mb-16 px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Your Daily Wellness Schedule</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSchedule()}
                className="px-3 py-1 bg-white dark:bg-gray-800 rounded border hover:shadow-sm text-sm"
              >
                Refresh
              </button>

              <button
                onClick={() => setShowTimeline((s) => !s)}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
              >
                {showTimeline ? "Hide Timeline" : "Show Timeline"}
              </button>
            </div>
          </div>

          {loadingSchedule ? (
            <div className="text-center text-gray-500">Loading schedule...</div>
          ) : schedule ? (
            <>
              <DailySchedule
                schedule={schedule}
                onRegenerate={() => generateSchedule(schedule.mood)}
              />

              {/* Timeline view */}
              {showTimeline && (
                <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-3">Timeline</h4>

                  {timelineItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline items available.</p>
                  ) : (
                    <div className="space-y-3">
                      {timelineItems.map((it) => (
                        <div key={it.id} className="flex items-start gap-3">
                          <div className="w-12 text-xs text-gray-500">{it.time || "—"}</div>
                          <div className="flex-1">
                            <TimelineItem item={it} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border dark:border-gray-700 text-center">
              <p className="mb-3">No schedule created for today.</p>
              <p className="mb-4 text-sm text-gray-500">Select a mood to generate a personalized plan:</p>

              <div className="flex flex-wrap justify-center gap-3">
                {["happy", "neutral", "anxious", "sad", "tired", "angry"].map((m) => (
                  <button
                    key={m}
                    onClick={() => generateSchedule(m)}
                    className="px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition text-sm"
                  >
                    Generate for {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}
        <section className="w-full max-w-4xl mb-16 px-4">
          <h3 className="text-2xl font-bold text-left mb-4">AI Recommendations</h3>

          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">No recommendations yet — generate a schedule or pick a mood.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((r, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.text}</p>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* Featured Guides */}
        <div className="mt-12 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl w-full">
          {[
            {
              title: "Mindful Beginnings",
              author: "Ava Reynolds",
              desc: "Start your journaling journey with calm and clarity.",
              tags: ["Mindfulness", "Clarity"],
              gradient: "from-orange-300 via-yellow-200 to-pink-200",
            },
            {
              title: "Healing Reflections",
              author: "Liam Carter",
              desc: "Unlock past emotions and embrace self-compassion.",
              tags: ["Healing", "Self-Compassion"],
              gradient: "from-blue-300 via-indigo-300 to-purple-300",
            },
            {
              title: "Flow of Time",
              author: "Sofia Bennett",
              desc: "Learn to manage your time and energy with balance.",
              tags: ["Balance", "Productivity"],
              gradient: "from-purple-300 via-violet-300 to-pink-300",
            },
            {
              title: "Inner Growth",
              author: "Ethan Wright",
              desc: "Discover your strengths and grow into your best self.",
              tags: ["Growth", "Strength"],
              gradient: "from-red-300 via-orange-300 to-yellow-300",
            },
          ].map((guide, idx) => (
            <div
              key={idx}
              className={`rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1 transform transition hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${guide.gradient} dark:from-gray-700 dark:via-gray-800 dark:to-gray-900`}
            >
              <div className="p-6 flex flex-col flex-1">
                <span className="inline-block text-xs font-semibold bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-3 py-1 rounded-full w-fit">
                  Featured
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {guide.author}
                </p>
                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm flex-1">
                  {guide.desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {guide.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-xs font-medium bg-white/70 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-700 dark:text-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights Section */}
        <section className="mt-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Explore More Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-lg shadow-lg border border-white/40 dark:border-gray-700 p-8 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300">
              <div className="mb-6">
                <span className="text-4xl">🔔</span>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Gentle Notifications
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                Receive mindful reminders to reflect on your thoughts and emotions.
              </p>
            </div>

            <div className="rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-lg shadow-lg border border-white/40 dark:border-gray-700 p-8 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300">
              <div className="mb-6">
                <span className="text-4xl">📤</span>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Import and Export
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                Download your journal entries as PDFs or export data securely.
              </p>
            </div>

            <div className="rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-lg shadow-lg border border-white/40 dark:border-gray-700 p-8 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute top-4 right-4 bg-lime-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                Coming Soon
              </div>
              <div className="mb-6">
                <span className="text-4xl">🎙️</span>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Voice Powered Coaching
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                Speak freely and let AI-powered voice sessions guide your growth.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Cookie Consent */}
      {showCookie && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center sm:text-left">
            By using{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              MindCare
            </span>
            , you agree to the storing of cookies on your device to enhance navigation, analyze site usage, and support our mindful community. Read our{" "}
            <a href="/privacy" className="text-purple-600 dark:text-purple-400 underline">Privacy Policy</a> for more information.
          </p>
          <button onClick={handleConsent} className="px-4 sm:px-5 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition text-sm sm:text-base">
            Understood
          </button>
        </div>
      )}

      {/* App Download / Mockup Section */}
      <section className="relative mt-20 mb-16 bg-gradient-to-br from-purple-100 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-3xl shadow-lg overflow-hidden mx-4 sm:mx-8 lg:mx-20 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-10 transition-all duration-500">
        <div className="relative w-full md:w-1/2 flex justify-center">
          <img src="/assets/mockup1.png" alt="App Mockup 1" className="w-48 sm:w-60 md:w-64 lg:w-72 rounded-[2.5rem] shadow-2xl transform hover:-translate-y-2 hover:rotate-2 transition duration-500" />
          <img src="/assets/mockup2.png" alt="App Mockup 2" className="absolute bottom-[-1rem] left-16 w-36 sm:w-48 md:w-56 lg:w-64 rounded-[2.5rem] shadow-2xl transform hover:-translate-y-3 -rotate-6 transition duration-500 hidden sm:block" />
        </div>

        <div className="text-center md:text-left w-full md:w-1/2">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100 leading-snug">
            Gain clarity and peace of mind,
            <br className="hidden sm:block" /> wherever you are.
          </h3>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
            Download <span className="font-semibold text-purple-600 dark:text-purple-400">MindCare</span> to start journaling today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <a href="#" className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition">
              <img src="/assets/apple.svg" alt="Apple" className="w-5 h-5" /> App Store
            </a>
            <a href="#" className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition">
              <img src="/assets/google.svg" alt="Google Play" className="w-5 h-5" /> Google Play
            </a>
            <a href="#" className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition">🌐 Web App</a>
          </div>

          <div className="mt-6 flex justify-center md:justify-start">
            <img src="/assets/qrcode.png" alt="Download QR" className="w-32 h-32 rounded-xl shadow-md hover:scale-105 transition-transform duration-300" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12 transition-colors duration-300">
        © {new Date().getFullYear()} MindCare. All rights reserved.
      </footer>
    </div>
  );
}
