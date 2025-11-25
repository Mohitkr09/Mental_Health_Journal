import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      // Backend returns:
      // { _id, name, email, avatar, theme, token }
      const token = res.data.token;

      // Save token
      localStorage.setItem("token", token);

      // Save user info (without password)
      const userData = {
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        avatar: res.data.avatar,
        theme: res.data.theme,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Update global state
      setUser({
        ...userData,
        token,
      });

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: `max-w-md mx-auto mt-20 p-6 rounded-xl shadow-md transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
    }`,
    input: `p-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300 ${
      theme === "dark"
        ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
    }`,
    button: `p-2 rounded text-white font-medium shadow transition-colors duration-300 ${
      theme === "dark"
        ? "bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700"
        : "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
    }`,
    infoText: theme === "dark" ? "text-gray-400" : "text-gray-600",
    link:
      theme === "dark"
        ? "text-purple-400 hover:text-purple-300 font-medium"
        : "text-purple-600 hover:text-purple-700 font-medium",
  };

  return (
    <div className={styles.container}>
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      {error && (
        <p className="text-red-500 mb-4 text-center" role="alert">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className={styles.input}
          aria-label="Email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          className={styles.input}
          aria-label="Password"
        />
        <button
          type="submit"
          disabled={loading}
          className={styles.button}
          aria-busy={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className={`mt-4 text-center text-sm ${styles.infoText}`}>
        Don't have an account?{" "}
        <Link to="/register" className={styles.link}>
          Register
        </Link>
      </p>
    </div>
  );
}
