// src/pages/Home.jsx
import { useState, useEffect } from "react";
import DailyMoodPopup from "../components/DailyMoodPopup.jsx";
import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Home() {
  const [showCookie, setShowCookie] = useState(true);
  const { addEntry } = useJournal();
  const { user } = useAuth(); // get logged-in user
  const { theme } = useTheme();

  // Load cookie consent from localStorage
  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent) setShowCookie(false);
  }, []);

  const handleConsent = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowCookie(false);
  };

  const guides = [
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
  ];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900"
      }`}
    >
      {/* Daily Mood Popup */}
      {user && <DailyMoodPopup user={user} />}

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-4 sm:px-6 lg:px-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-snug sm:leading-tight mt-12">
          Welcome to <span className="text-purple-600 dark:text-purple-400">MindCare</span> ✨
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl max-w-xl sm:max-w-2xl">
          Your private AI-enhanced journaling guide to heal, grow, and flourish.
        </p>

        {/* Featured Guides */}
        <div className="mt-12 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl w-full">
          {guides.map((guide, idx) => (
            <div
              key={idx}
              className={`rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1 transform transition hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${guide.gradient} dark:from-gray-700 dark:via-gray-800 dark:to-gray-900`}
            >
              <div className="p-6 flex flex-col flex-1">
                <span className="inline-block text-xs font-semibold bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-3 py-1 rounded-full w-fit">
                  Featured
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{guide.title}</h3>
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{guide.author}</p>
                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm flex-1">{guide.desc}</p>
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
      </main>

      {/* Cookie Consent */}
      {showCookie && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center sm:text-left">
            By using <span className="font-semibold text-purple-600 dark:text-purple-400">MindCare</span>, 
            you agree to the storing of cookies on your device to enhance navigation, 
            analyze site usage, and support our mindful community. Read our{" "}
            <a href="/privacy" className="text-purple-600 dark:text-purple-400 underline">
              Privacy Policy
            </a>{" "}
            for more information.
          </p>
          <button
            onClick={handleConsent}
            className="px-4 sm:px-5 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition text-sm sm:text-base"
          >
            Understood
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12 transition-colors duration-300">
        © {new Date().getFullYear()} MindCare. All rights reserved.
      </footer>
    </div>
  );
}
