// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const JournalContext = createContext();
export const useJournal = () => useContext(JournalContext);

export const JournalProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // get user & auth loading
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch journal entries from backend
  const fetchEntries = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      console.warn("⚠️ No token found or user not logged in, skipping journal fetch");
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/journal", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching journal entries:", err.response?.data?.message || err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new journal entry
  const addEntry = (entry) => {
    setEntries((prev) => [entry, ...prev]);
  };

  // Automatically fetch entries when user logs in or changes
  useEffect(() => {
    if (!authLoading && user) fetchEntries();
    if (!user) setEntries([]);
  }, [user, authLoading]);

  return (
    <JournalContext.Provider value={{ entries, loading, fetchEntries, addEntry }}>
      {children}
    </JournalContext.Provider>
  );
};
