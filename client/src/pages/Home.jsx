import { useState, useEffect } from "react";
import DailyMoodPopup from "../components/DailyMoodPopup.jsx";
import { useJournal } from "../context/JournalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import qrcode from "../assets/qrcode.png";

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
          Welcome to{" "}
          <span className="text-purple-600 dark:text-purple-400">MindCare</span>{" "}
          ✨
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
            {/* Gentle Notifications */}
            <div className="rounded-3xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-lg shadow-lg border border-white/40 dark:border-gray-700 p-8 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300">
              <div className="mb-6">
                <span className="text-4xl">🔔</span>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Gentle Notifications
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                Receive mindful reminders to reflect on your thoughts and
                emotions.
              </p>
            </div>

            {/* Import and Export */}
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

            {/* Voice Powered Coaching */}
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
                Speak freely and let AI-powered voice sessions guide your
                growth.
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
            , you agree to the storing of cookies on your device to enhance
            navigation, analyze site usage, and support our mindful community.
            Read our{" "}
            <a
              href="/privacy"
              className="text-purple-600 dark:text-purple-400 underline"
            >
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
{/* App Download Section */}
<section className="relative mt-20 mb-16 bg-gradient-to-br from-purple-100 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-3xl shadow-lg overflow-hidden mx-4 sm:mx-8 lg:mx-20 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-10 transition-all duration-500">
  {/* Left: App Preview Mockup */}
  <div className="relative w-full md:w-1/2 flex justify-center">
    <img
      src="/assets/mockup1.png" // Replace with your image path
      alt="App Mockup 1"
      className="w-48 sm:w-60 md:w-64 lg:w-72 rounded-[2.5rem] shadow-2xl transform hover:-translate-y-2 hover:rotate-2 transition duration-500"
    />
    <img
      src="/assets/mockup2.png" // Replace with your image path
      alt="App Mockup 2"
      className="absolute bottom-[-1rem] left-16 w-36 sm:w-48 md:w-56 lg:w-64 rounded-[2.5rem] shadow-2xl transform hover:-translate-y-3 -rotate-6 transition duration-500 hidden sm:block"
    />
  </div>

  {/* Right: Text + QR + Buttons */}
  <div className="text-center md:text-left w-full md:w-1/2">
    <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100 leading-snug">
      Gain clarity and peace of mind,
      <br className="hidden sm:block" /> wherever you are.
    </h3>
    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
      Download <span className="font-semibold text-purple-600 dark:text-purple-400">MindCare</span> to start journaling today.
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
      <a
        href="#"
        className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition"
      >
        <img src="/assets/apple.svg" alt="Apple" className="w-5 h-5" />
        App Store
      </a>
      <a
        href="#"
        className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition"
      >
        <img src="/assets/google.svg" alt="Google Play" className="w-5 h-5" />
        Google Play
      </a>
      <a
        href="#"
        className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow-md hover:opacity-90 transition"
      >
        🌐 Web App
      </a>
    </div>

    {/* QR Code */}
    <div className="mt-6 flex justify-center md:justify-start">
      <img
        src="/assets/qrcode" 
        alt="Download QR"
        className="w-32 h-32 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
      />
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
