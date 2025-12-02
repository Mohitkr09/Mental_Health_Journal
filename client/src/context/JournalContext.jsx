// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const JournalContext = createContext();

// --------------------------
// Custom Hook
// --------------------------
export const useJournal = () => {
  return useContext(JournalContext);
};

// Keep entries for 30 DAYS
const KEEP_MS = 30 * 24 * 60 * 60 * 1000; 

// --------------------------
// Provider Component
// --------------------------
export const JournalProvider = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ------------------------------------------
   * Load initial cache on mount
   -------------------------------------------*/
  useEffect(() => {
    try {
      const cached = localStorage.getItem("journalEntries");
      if (cached) setEntries(JSON.parse(cached));
    } catch {
      localStorage.removeItem("journalEntries");
    }
  }, []);

  /* ------------------------------------------
   * Persist every change to LocalStorage
   -------------------------------------------*/
  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  /* ------------------------------------------
   * Fetch entries from backend & merge
   -------------------------------------------*/
  const fetchEntries = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = Array.isArray(res.data) ? res.data : [];

      const now = Date.now();
      const backendRecent = list.filter(
        (item) => now - new Date(item.createdAt).getTime() <= KEEP_MS
      );

      // Merge backend + local cache without duplicates
      const local = JSON.parse(localStorage.getItem("journalEntries") || "[]");
      const merged = [
        ...backendRecent,
        ...local.filter((loc) => !backendRecent.some((srv) => srv._id === loc._id)),
      ];

      setEntries(merged);
      localStorage.setItem("journalEntries", JSON.stringify(merged));
    } catch (err) {
      console.error("⚠️ Journal fetch failed:", err);
      setError("Failed to load journal entries");

      // fallback to cache
      const cached = localStorage.getItem("journalEntries");
      if (cached) setEntries(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch only when logged in user changes
  useEffect(() => {
    if (user) fetchEntries();
  }, [user, fetchEntries]);

  /* ------------------------------------------
   * Add new entry
   -------------------------------------------*/
  const addEntry = async (entryData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    try {
      const res = await api.post("/journal", entryData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const saved = res.data?.journal || res.data;

      const updated = [saved, ...entries];
      const now = Date.now();
      const pruned = updated.filter(
        (it) => now - new Date(it.createdAt).getTime() <= KEEP_MS
      );

      setEntries(pruned);
      localStorage.setItem("journalEntries", JSON.stringify(pruned));
      return saved;
    } catch (err) {
      console.error("Add entry failed:", err);
      throw err;
    }
  };

  return (
    <JournalContext.Provider
      value={{
        entries,
        loading,
        error,
        fetchEntries,
        addEntry,
        setEntries,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};
