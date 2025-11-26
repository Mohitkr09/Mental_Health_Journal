// src/components/TimelineView.jsx
import React, { useState, useEffect } from "react";
import { Check, Clock, PlayCircle, Flag } from "lucide-react";

export default function TimelineView({ schedule }) {
  const [completed, setCompleted] = useState(schedule?.completed || []);
  const now = new Date();

  useEffect(() => {
    setCompleted(schedule?.completed || []);
  }, [schedule]);

  const getStatus = (time, index) => {
    const [h, m] = time.split(":").map(Number);
    const taskTime = new Date();
    taskTime.setHours(h, m, 0);

    if (completed.includes(index)) return "done";
    if (taskTime < now) return "missed";
    if (taskTime > now) return "upcoming";
    return "current";
  };

  const statusStyles = {
    done: "bg-green-600 text-white border-green-700 shadow-green-500/30",
    missed: "bg-gray-800 text-gray-400 border-gray-700",
    current:
      "bg-purple-600 text-white border-purple-700 shadow-purple-500/50 animate-pulse",
    upcoming: "bg-transparent border-gray-600 text-gray-400",
  };

  const badgeText = {
    done: "Done",
    missed: "Missed",
    current: "Now",
    upcoming: "Soon",
  };

  const statusIcon = {
    done: <Check size={16} />,
    missed: <Flag size={16} />,
    current: <PlayCircle size={16} />,
    upcoming: <Clock size={16} />,
  };

  if (!schedule) return null;

  return (
    <div className="mx-auto w-full max-w-4xl p-6 rounded-[2rem] bg-gray-900/70 border border-gray-800 shadow-2xl backdrop-blur-2xl relative">
      <h2 className="text-center text-3xl font-bold text-purple-300 drop-shadow mb-10 tracking-wide">
        Your Day Timeline
      </h2>

      <div className="relative space-y-14">
        {/* Vertical glowing line */}
        <div className="absolute left-1/2 -translate-x-1/2 h-full w-[3px] bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 blur-[1px]" />

        {schedule.items.map((item, i) => {
          const status = getStatus(item.time, i);
          const isLeft = i % 2 === 0;

          return (
            <div
              key={i}
              className={`flex items-center gap-6 group transition-all duration-300 ${
                isLeft ? "flex-row-reverse" : ""
              }`}
            >
              {/* Time */}
              <div className="text-sm w-20 text-gray-400 font-mono">
                {item.time}
              </div>

              {/* Node marker */}
              <div
                className={`relative w-5 h-5 rounded-full border-2 ${
                  status === "current"
                    ? "bg-purple-500 border-purple-300 animate-ping"
                    : status === "done"
                    ? "bg-green-500 border-green-300"
                    : status === "missed"
                    ? "bg-gray-600 border-gray-500"
                    : "bg-gray-800 border-gray-700"
                }`}
              >
                {/* Glow behind */}
                <span
                  className={`absolute inset-0 rounded-full blur-md ${
                    status === "current"
                      ? "bg-purple-500/60"
                      : status === "done"
                      ? "bg-green-500/40"
                      : ""
                  }`}
                />
              </div>

              {/* Task card */}
              <div
                className={`flex-1 p-5 rounded-2xl border transform transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl bg-gradient-to-br ${
                  status === "done"
                    ? "from-green-900/50 to-green-700/20 border-green-700"
                    : status === "current"
                    ? "from-purple-900/60 to-purple-700/20 border-purple-700"
                    : status === "missed"
                    ? "from-gray-900/60 to-gray-800/20 border-gray-700"
                    : "from-gray-800/60 to-gray-700/20 border-gray-700"
                }`}
              >
                <h4 className="font-bold text-gray-100 text-lg tracking-wide">
                  {item.title}
                </h4>

                <p className="text-sm text-gray-400 mt-1">{item.description}</p>

                {item.durationMins && (
                  <p className="text-xs text-indigo-400 mt-2">
                    ⏱ {item.durationMins} min
                  </p>
                )}

                {/* Status Badge */}
                <button
                  className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-semibold transition-all ${statusStyles[status]} hover:scale-105`}
                >
                  {statusIcon[status]} {badgeText[status]}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
