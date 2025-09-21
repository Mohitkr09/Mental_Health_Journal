import { useState, useEffect } from "react";
import { Flame, Award } from "lucide-react";
import Swal from "sweetalert2";

export default function StreakAndBadges() {
  const [streak, setStreak] = useState(3); // mock streak (days)
  const [badges, setBadges] = useState([
    { id: 1, name: "Journal Beginner", unlocked: true, emoji: "📓" },
    { id: 2, name: "Consistent Writer", unlocked: false, emoji: "✍️" },
    { id: 3, name: "One Week Strong", unlocked: false, emoji: "💪" },
    { id: 4, name: "Night Owl", unlocked: false, emoji: "🌙" },
  ]);

  // ✅ Simulate earning a new badge after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      unlockBadge(2); // unlock "Consistent Writer"
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 🔓 Unlock badge
  const unlockBadge = (id) => {
    setBadges((prev) =>
      prev.map((badge) =>
        badge.id === id ? { ...badge, unlocked: true } : badge
      )
    );

    const badge = badges.find((b) => b.id === id);
    if (badge) {
      Swal.fire({
        title: "🎉 New Badge Unlocked!",
        text: `${badge.emoji} ${badge.name}`,
        icon: "success",
        confirmButtonColor: "#8b5cf6",
      });
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg mt-8">
      {/* 🔥 Streak Tracker */}
      <div className="flex items-center gap-3 mb-6">
        <Flame className="text-orange-500" size={28} />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Current Streak:{" "}
          <span className="text-orange-600 dark:text-orange-400">{streak} days</span>
        </h2>
      </div>

      {/* 🏅 Badge Section */}
      <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Badges
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition ${
              badge.unlocked
                ? "bg-purple-100 dark:bg-purple-800 border-purple-400"
                : "bg-gray-100 dark:bg-gray-800 border-gray-400 opacity-50"
            }`}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              {badge.name}
            </p>
            {badge.unlocked ? (
              <span className="text-green-600 text-xs mt-1">Unlocked</span>
            ) : (
              <span className="text-gray-500 text-xs mt-1">Locked</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
