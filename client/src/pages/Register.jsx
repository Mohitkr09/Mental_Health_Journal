import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { UserPlus, Mail, Lock } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return setError("All fields are required");
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return setError("Invalid email format");
    }

    if (trimmedPassword.length < 6) {
      return setError("Password must be at least 6 characters long");
    }

    try {
      setLoading(true);
      await register(trimmedName, trimmedEmail, trimmedPassword);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden
      px-4 sm:px-6 lg:px-8
      bg-gradient-to-br from-indigo-50 via-white to-purple-100
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      {/* 🌈 BACKGROUND GLOW */}
      <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] 
      bg-purple-300/30 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>

      <div className="absolute w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] 
      bg-indigo-300/30 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      {/* 🌿 CARD */}
      <div
        className="w-full max-w-sm sm:max-w-md md:max-w-lg
        p-6 sm:p-8
        rounded-3xl
        bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl
        border border-white/30 dark:border-gray-700
        shadow-[0_10px_40px_rgba(0,0,0,0.15)]
        animate-fadeIn"
      >
        {/* 🌸 HEADER */}
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl mb-2">🌿✨</div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Start Your Journey
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            A safe space for your mind 💙
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-center mb-3 text-xs sm:text-sm animate-pulse">
            {error}
          </p>
        )}

        {/* FORM */}
        <form className="space-y-4" onSubmit={handleRegister}>

          {/* NAME */}
          <div className="flex items-center gap-3 p-3 rounded-xl
          bg-white/80 dark:bg-gray-900/70
          border border-gray-200 dark:border-gray-700
          focus-within:ring-2 focus-within:ring-purple-400 transition">

            <UserPlus className="text-purple-500" size={18} />

            <input
              type="text"
              placeholder="Full name"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 dark:text-gray-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div className="flex items-center gap-3 p-3 rounded-xl
          bg-white/80 dark:bg-gray-900/70
          border border-gray-200 dark:border-gray-700
          focus-within:ring-2 focus-within:ring-purple-400 transition">

            <Mail className="text-purple-500" size={18} />

            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 dark:text-gray-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center gap-3 p-3 rounded-xl
          bg-white/80 dark:bg-gray-900/70
          border border-gray-200 dark:border-gray-700
          focus-within:ring-2 focus-within:ring-purple-400 transition">

            <Lock className="text-purple-500" size={18} />

            <input
              type="password"
              placeholder="Password"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-800 dark:text-gray-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm sm:text-base font-semibold
            bg-gradient-to-r from-purple-500 to-indigo-500
            hover:scale-[1.02] active:scale-95
            transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? "Creating..." : "Begin Journey"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}