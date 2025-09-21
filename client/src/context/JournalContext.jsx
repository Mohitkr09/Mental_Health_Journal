// src/context/JournalContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const JournalContext = createContext();

export const useJournal = () => useContext(JournalContext);

export const JournalProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch entries from backend
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("http://localhost:5000/api/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching journal entries:", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Add a new entry to context
  const addEntry = (entry) => {
    setEntries((prev) => [entry, ...prev]);
  };

  // Optionally, a function to refresh entries manually
  const refreshEntries = () => {
    fetchEntries();
  };

  return (
    <JournalContext.Provider
      value={{
        entries,
        loading,
        error,
        addEntry,
        refreshEntries,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};
