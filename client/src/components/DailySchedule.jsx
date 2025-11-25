// src/components/DailySchedule.jsx
import React, { useState, useEffect } from "react";
import {
  Heart,
  Activity,
  Apple,
  PenLine,
  Moon,
  Sun,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

const icons = {
  meditation: <Heart />,
  movement: <Activity />,
  food: <Apple />,
  journal: <PenLine />,
  sleep: <Moon />,
  default: <Sun />,
};

export default function DailySchedule({ schedule, onRegenerate }) {
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => setLocalSchedule(schedule), [schedule]);

  if (!localSchedule) return null;

  const total = (localSchedule.items?.length) || 0;
  const completedCount = localSchedule.completed?.length || 0;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  const toggle = async (index) => {
    // optimistic update
    const wasCompleted = localSchedule.completed?.includes(index);
    let newCompleted = (localSchedule.completed || []).slice();
    if (wasCompleted) newCompleted = newCompleted.filter((i) => i !== index);
    else newCompleted.push(index);

    setLocalSchedule({ ...localSchedule, completed: newCompleted });

    try {
      await axios.post(
        `${API_BASE_URL}/api/schedule/complete`,
        { index, date: localSchedule.date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to toggle complete:", err);
      // revert on error
      setLocalSchedule({ ...localSchedule, completed: localSchedule.completed });
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            Today — <span className="capitalize text-purple-600">{localSchedule.mood}</span>
          </h3>
          <p className="text-sm text-gray-500">{completedCount} of {total} tasks completed</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRegenerate}
            className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
        <div
          style={{ width: `${progress}%` }}
          className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"
        />
      </div>

      <div className="space-y-3">
        {localSchedule.items?.map((item, idx) => {
          const done = localSchedule.completed?.includes(idx);
          return (
            <div key={idx} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <input
                    id={`chk-${idx}`}
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(idx)}
                    className="h-4 w-4"
                  />
                </div>

                <div>
                  <p className={`text-sm font-medium ${done ? "line-through text-gray-400" : ""}`}>{item.title}</p>
                  {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                  {item.durationMins && <p className="text-xs text-gray-400 mt-1">⏱ {item.durationMins} min</p>}
                </div>
              </div>

              <div className="text-sm text-purple-600 font-semibold">{item.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
