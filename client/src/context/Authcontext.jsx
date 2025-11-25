// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ------------------ SAFE USER RESTORE ------------------
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    // prevent crash when stored as literal "undefined"
    if (!saved || saved === "undefined") {
      localStorage.removeItem("user");
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch (err) {
      console.warn("⚠️ Invalid user JSON, clearing...", err);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ------------------ FETCH PROFILE ON MOUNT ------------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token || token === "null") {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/profile");

        const freshUser = {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          avatar: res.data.avatar,
          theme: res.data.theme,
          streak: res.data.streak,
          badges: res.data.badges,
          token,
        };

        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ------------------ LOGIN ------------------
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    const token = res.data.token;

    const userData = {
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      avatar: res.data.avatar,
      theme: res.data.theme,
      token,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // ------------------ REGISTER ------------------
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });

    const token = res.data.token;

    const userData = {
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      avatar: res.data.avatar,
      theme: res.data.theme,
      token,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // ------------------ LOGOUT ------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
