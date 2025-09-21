// src/context/ThemeContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../utils/api.js";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const token = localStorage.getItem("token");

  // ✅ Apply theme to <html>
  const applyTheme = useCallback((newTheme) => {
    document.documentElement.classList.remove("light", "dark");

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.add(prefersDark ? "dark" : "light");
    }

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  // ✅ Load theme (server > localStorage > system)
  useEffect(() => {
    const loadTheme = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.theme) {
            applyTheme(res.data.theme);
            return;
          }
        } catch (err) {
          console.warn("⚠️ Failed to fetch theme from server:", err);
        }
      }

      const storedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(storedTheme || (prefersDark ? "dark" : "light"));
    };

    loadTheme();
  }, [token, applyTheme]);

  // ✅ Toggle theme & sync with backend
  const toggleTheme = async () => {
    if (token) {
      try {
        const res = await api.put(
          "/auth/theme",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.theme) {
          applyTheme(res.data.theme); // ✅ use server’s theme
        }
      } catch (err) {
        console.error("❌ Failed to update theme on server:", err);
      }
    } else {
      // fallback if not logged in
      const newTheme = theme === "light" ? "dark" : "light";
      applyTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
