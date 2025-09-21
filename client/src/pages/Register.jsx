import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";

export default function Register({ setUser }) { // receive setUser from App
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", { name, email, password });

      // ✅ store token
      localStorage.setItem("token", res.data.token);

      // ✅ update user state
      setUser({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        avatar: res.data.avatar || null,
        token: res.data.token,
      });

      // ✅ navigate to home
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form className="flex flex-col gap-4" onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          className="p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <span
          className="text-purple-600 hover:underline cursor-pointer"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
}
