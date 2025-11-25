// src/components/TimelineView.jsx
import React from "react";

export default function TimelineView({ schedule }) {
  if (!schedule) return null;

  return (
    <div className="space-y-4">
      {schedule.items.map((it, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="w-16 text-right text-xs text-gray-500">{it.time}</div>
          <div className="flex-1 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{it.title}</h4>
                <p className="text-xs text-gray-500">{it.description}</p>
              </div>
              <div className="text-xs text-gray-400">{it.durationMins ? `${it.durationMins} min` : ""}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
