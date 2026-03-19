import React, { useState, useEffect } from "react";
import {
  Heart,
  Activity,
  Apple,
  PenLine,
  Moon,
  Sun,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import clsx from "clsx";

const icons = {
  meditation: <Heart className="text-pink-500" size={18} />,
  movement: <Activity className="text-blue-500" size={18} />,
  food: <Apple className="text-green-500" size={18} />,
  journal: <PenLine className="text-yellow-500" size={18} />,
  sleep: <Moon className="text-indigo-500" size={18} />,
  default: <Sun className="text-orange-500" size={18} />,
};

export default function DailySchedule({ schedule, onRegenerate }) {
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const token = localStorage.getItem("token");
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => setLocalSchedule(schedule), [schedule]);

  if (!localSchedule) return null;

  const total = localSchedule.items?.length || 0;
  const completedCount = localSchedule.completed?.length || 0;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  const toggle = async (index) => {
    const wasCompleted = localSchedule.completed?.includes(index);
    let updated = [...localSchedule.completed];

    if (wasCompleted) updated = updated.filter((i) => i !== index);
    else updated.push(index);

    setLocalSchedule({ ...localSchedule, completed: updated });

    try {
      await axios.post(
        `${API_BASE_URL}/schedule/complete`,
        { index, date: localSchedule.date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative p-6 rounded-3xl overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 blur-3xl -z-10"></div>

      {/* MAIN GLASS CARD */}
      <div className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 
      rounded-3xl p-6 shadow-[0_15px_50px_rgba(0,0,0,0.2)]">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">

          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3">
              Today’s Plan
              <span className="px-3 py-1 text-xs rounded-full 
              bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow">
                {localSchedule.mood}
              </span>
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {completedCount}/{total} completed • {progress}%
            </p>
          </div>

          <button
            onClick={onRegenerate}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white 
            hover:rotate-180 transition duration-500 shadow-lg"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-8">
          <div
            style={{ width: `${progress}%` }}
            className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-500 
            shadow-[0_0_15px_rgba(124,58,237,0.9)] transition-all duration-700"
          />

          {/* shimmer effect */}
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>

        {/* TASKS */}
        <div className="space-y-4">
          {localSchedule.items?.map((item, idx) => {
            const done = localSchedule.completed?.includes(idx);
            const Icon = icons[item.type] || icons.default;

            return (
              <div
                key={idx}
                onClick={() => toggle(idx)}
                className={clsx(
                  "group relative flex justify-between items-center p-4 rounded-2xl cursor-pointer",
                  "transition-all duration-300 border backdrop-blur-lg",
                  "bg-white/60 dark:bg-gray-900/60",
                  "hover:shadow-2xl hover:-translate-y-1",
                  done &&
                    "opacity-60 bg-gradient-to-r from-green-200/30 to-green-300/20"
                )}
              >
                {/* glow border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                bg-gradient-to-r from-purple-400 to-indigo-400 blur-xl -z-10 transition"></div>

                {/* LEFT */}
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md 
                  group-hover:scale-110 transition">
                    {Icon}
                  </div>

                  <div>
                    <p
                      className={clsx(
                        "font-medium text-sm",
                        done && "line-through text-gray-400"
                      )}
                    >
                      {item.title}
                    </p>

                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}

                    {/* BADGES */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.durationMins && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                          ⏱ {item.durationMins} min
                        </span>
                      )}

                      {item.type && (
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600 capitalize">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                  <span className="text-purple-600 text-sm font-semibold">
                    {item.time}
                  </span>

                  {done ? (
                    <CheckCircle2
                      className="text-green-500 scale-110 transition"
                      size={22}
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-purple-500 
                    group-hover:bg-purple-200 transition" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}