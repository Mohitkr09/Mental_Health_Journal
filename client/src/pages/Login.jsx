import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // context login()

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 animate-fadeIn">
        
        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2">
          <LogIn size={26} className="text-purple-600" /> Login
        </h2>
        <p className="mt-1 mb-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Welcome back 👋 Continue your journey
        </p>

        {/* Error */}
        {error && (
          <p
            className="text-red-500 text-center mb-3 text-sm font-medium animate-pulse"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* FORM */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 transition">
            <Mail className="text-purple-600" size={20} />
            <input
              type="email"
              placeholder="Email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 transition">
            <Lock className="text-purple-600" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg text-sm font-semibold transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
        </div>

        {/* Register redirect */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
