// src/components/DailySchedule.jsx
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
    <div className="p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 
    bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/50 
    backdrop-blur-xl transition-all duration-300">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Today’s Plan
            <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-600 capitalize">
              {localSchedule.mood}
            </span>
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {completedCount} of {total} completed • {progress}%
          </p>
        </div>

        <button
          onClick={onRegenerate}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white 
          hover:scale-110 active:scale-95 shadow-lg transition-all duration-200"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-8">
        <div
          style={{ width: `${progress}%` }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
        />
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {localSchedule.items?.map((item, idx) => {
          const done = localSchedule.completed?.includes(idx);
          const Icon = icons[item.type] || icons.default;

          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              className={clsx(
                "group flex justify-between items-center p-4 rounded-2xl cursor-pointer",
                "transition-all duration-300 border",
                "bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg",
                "hover:shadow-xl hover:-translate-y-[2px]",
                done && "opacity-60 scale-[0.97]"
              )}
            >
              {/* Left */}
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md group-hover:scale-110 transition">
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

                  {item.durationMins && (
                    <p className="text-xs text-purple-500 font-medium mt-1">
                      ⏱ {item.durationMins} min
                    </p>
                  )}
                </div>
              </div>

              {/* Right */}
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
                  <div className="h-5 w-5 rounded-full border-2 border-purple-500 group-hover:bg-purple-100 transition" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}