// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js"; // ✅ use your configured Axios instance

const JournalContext = createContext();

export function JournalProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fetch all journal entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/journal"); // ✅ uses baseURL http://localhost:5000/api
      setEntries(Array.isArray(res.data) ? res.data : []); // ✅ ensure array
    } catch (err) {
      console.error("Error fetching journals:", err);
      setError("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Fetch on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  // 📝 Add new journal entry and auto-update everywhere
  const addEntry = async (newEntry) => {
    try {
      const res = await api.post("/journal", newEntry); // ✅ fixed here
      const savedEntry = res.data || newEntry;
      setEntries((prev) => [...prev, savedEntry]); // ✅ immediate context update
      return savedEntry;
    } catch (err) {
      console.error("❌ Error adding entry:", err);
      throw err;
    }
  };

  // ♻️ Optional: auto-refresh entries every 10s
  useEffect(() => {
    const sync = setInterval(fetchEntries, 10000);
    return () => clearInterval(sync);
  }, []);

  return (
    <JournalContext.Provider
      value={{ entries, setEntries, addEntry, fetchEntries, loading, error }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export const useJournal = () => useContext(JournalContext);
