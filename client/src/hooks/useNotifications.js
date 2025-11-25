// src/hooks/useNotifications.js
import { useEffect, useRef } from "react";

export default function useNotifications(schedule) {
  const timersRef = useRef([]);

  useEffect(() => {
    // clear old timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    if (!schedule || !("Notification" in window)) return;

    // request permission if not granted
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission !== "granted") return;

    // schedule notifications for upcoming items (today)
    schedule.items?.forEach((item, idx) => {
      // parse time like "07:00"
      const [h, m] = item.time.split(":").map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      const delay = target.getTime() - now.getTime();
      if (delay > 0) {
        const t = setTimeout(() => {
          new Notification("MindCare — Time for: " + item.title, {
            body: item.description || "",
          });
        }, delay);
        timersRef.current.push(t);
      }
    });

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [schedule]);
}
