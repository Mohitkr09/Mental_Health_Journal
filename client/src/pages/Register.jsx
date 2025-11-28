import { useState } from "react";
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 🔍 Frontend validations
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 animate-fadeIn">

        <h2 className="text-3xl font-extrabold text-center text-gray-800 dark:text-gray-100">
          Create Your Account
        </h2>
        <p className="mt-1 mb-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Join the mindful journey 🌿
        </p>

        {error && (
          <p className="text-red-500 text-center mb-3 text-sm animate-pulse">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 transition">
            <UserPlus className="text-purple-600" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              className="bg-transparent flex-1 focus:outline-none text-gray-800 dark:text-gray-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 transition">
            <Mail className="text-purple-600" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              className="bg-transparent flex-1 focus:outline-none text-gray-800 dark:text-gray-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 transition">
            <Lock className="text-purple-600" size={20} />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              className="bg-transparent flex-1 focus:outline-none text-gray-800 dark:text-gray-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        </div>

        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
          Already have an account?{" "}
          <Link className="text-purple-600 dark:text-purple-400 font-semibold hover:underline" to="/login">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
