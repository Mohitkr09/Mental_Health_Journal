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
  meditation: <Heart className="text-pink-500" />,
  movement: <Activity className="text-blue-500" />,
  food: <Apple className="text-green-500" />,
  journal: <PenLine className="text-yellow-500" />,
  sleep: <Moon className="text-indigo-500" />,
  default: <Sun className="text-orange-500" />,
};

export default function DailySchedule({ schedule, onRegenerate }) {
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
      setLocalSchedule({ ...localSchedule });
      console.error(err);
    }
  };

  return (
    <div className="p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-white/60 dark:bg-gray-800/50 transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">
            Today’s Plan — 
            <span className="capitalize text-purple-600 ml-1">
              {localSchedule.mood}
            </span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} of {total} tasks completed
          </p>
        </div>

        <button
          onClick={onRegenerate}
          className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 active:scale-95 shadow-lg transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-6">
        <div
          style={{ width: `${progress}%` }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"
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
              className={clsx(
                "flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer shadow-sm",
                "bg-gray-50/70 dark:bg-gray-900/60 backdrop-blur-md border-gray-200 dark:border-gray-700 hover:shadow-xl",
                done && "opacity-60 scale-[0.98]"
              )}
              onClick={() => toggle(idx)}
            >
              {/* Left */}
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
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
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                  {item.durationMins && (
                    <p className="text-xs text-purple-500 font-medium mt-1">
                      ⏱ {item.durationMins} min
                    </p>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                <span className="text-purple-600 text-sm font-semibold">
                  {item.time}
                </span>

                {done ? (
                  <CheckCircle2 className="text-green-500" size={22} />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-purple-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
