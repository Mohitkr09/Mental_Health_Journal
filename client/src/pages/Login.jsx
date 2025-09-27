import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api.js";
import { useTheme } from "../context/ThemeContext.jsx"; // ✅ import theme context

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme(); // ✅ current theme

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data);
      navigate("/"); // go to home
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`max-w-md mx-auto mt-20 p-6 rounded-xl shadow-md 
        transition-colors duration-300
        ${theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400 
            transition-colors duration-300
            ${theme === "dark" ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400" 
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-400 
            transition-colors duration-300
            ${theme === "dark" ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400" 
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`p-2 rounded text-white font-medium shadow 
            transition-colors duration-300
            ${theme === "dark" ? "bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700" 
                              : "bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p
        className={`mt-4 text-center text-sm 
          ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
      >
        Don't have an account?{" "}
        <Link
          to="/register"
          className={`font-medium ${theme === "dark" ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"}`}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
