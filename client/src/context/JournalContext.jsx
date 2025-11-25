// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const JournalContext = createContext();

export function JournalProvider({ children }) {
  const { user } = useAuth(); // ✅ get logged-in user from Auth
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** ----------------------------------------------------------------
   *  FETCH JOURNALS ONLY WHEN:
   *   ✅ user exists
   *   ✅ token exists
   * ---------------------------------------------------------------- */
  const fetchEntries = async () => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      console.warn("⛔ No user/token — skipping journal fetch");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching journals:", err);
      setError("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  /** ----------------------------------------------------------------
   *  FETCH WHEN USER LOGS IN
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (user) {
      console.log("✅ User ready — fetching journals");
      fetchEntries();
    }
  }, [user]); // rerun when user becomes available

  /** ----------------------------------------------------------------
   *  ADD ENTRY
   * ---------------------------------------------------------------- */
  const addEntry = async (newEntry) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("⛔ Cannot add entry — No token!");
      throw new Error("Not authenticated");
    }

    try {
      const res = await api.post("/journal", newEntry, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedEntry = res.data?.journal || res.data;

      setEntries((prev) => [savedEntry, ...prev]);
      return savedEntry;
    } catch (err) {
      console.error("❌ Error adding entry:", err);
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
