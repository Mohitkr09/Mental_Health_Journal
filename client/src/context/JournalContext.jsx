// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const JournalContext = createContext();

export function JournalProvider({ children }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

  /** -------------------------------------------------------
   * LOAD FROM LOCAL STORAGE FIRST
   * ------------------------------------------------------ */
  useEffect(() => {
    const cached = localStorage.getItem("journalEntries");
    if (cached) {
      setEntries(JSON.parse(cached));
    }
  }, []);

  /** -------------------------------------------------------
   * SAVE TO LOCAL STORAGE ON EVERY CHANGE
   * ------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  /** -------------------------------------------------------
   * FETCH FROM BACKEND + MERGE, NOT OVERWRITE
   * ------------------------------------------------------ */
  const fetchEntries = async () => {
    const token = localStorage.getItem("token");

    if (!user || !token) return;

    setLoading(true);
    try {
      const res = await api.get("/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const backendList = Array.isArray(res.data) ? res.data : [];

      // Filter backend 30 days
      const now = Date.now();
      const backendRecent = backendList.filter(
        (item) => now - new Date(item.createdAt).getTime() <= KEEP_MS
      );

      // Load local cache
      const localList = JSON.parse(localStorage.getItem("journalEntries") || "[]");

      // MERGE:
      const merged = [
        ...backendRecent,
        ...localList.filter(
          (loc) => !backendRecent.some((srv) => srv._id === loc._id)
        ),
      ];

      setEntries(merged);
      localStorage.setItem("journalEntries", JSON.stringify(merged));
    } catch (err) {
      console.error("Fetch journals error:", err);

      // fallback to local cache
      const cached = localStorage.getItem("journalEntries");
      if (cached) setEntries(JSON.parse(cached));

      setError("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  /** -------------------------------------------------------
   * FETCH ONLY WHEN USER IS AVAILABLE
   * ------------------------------------------------------ */
  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  /** -------------------------------------------------------
   * ADD ENTRY (also saves locally)
   * ------------------------------------------------------ */
  const addEntry = async (entryData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    try {
      const res = await api.post("/journal", entryData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedEntry = res.data?.journal || res.data;

      const updated = [savedEntry, ...entries];

      // Keep only last 30 days
      const now = Date.now();
      const pruned = updated.filter(
        (it) => now - new Date(it.createdAt).getTime() <= KEEP_MS
      );

      setEntries(pruned);
      localStorage.setItem("journalEntries", JSON.stringify(pruned));

      return savedEntry;
    } catch (err) {
      console.error("Add entry error:", err);
      throw err;
    }
  };

  return (
    <JournalContext.Provider
      value={{
        entries,
        setEntries,
        addEntry,
        fetchEntries,
        loading,
        error,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export const useJournal = () => useContext(JournalContext);
