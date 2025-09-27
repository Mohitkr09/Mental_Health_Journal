import { useState } from "react";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "../context/ThemeContext.jsx";

export default function Profile({ user, setUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme(); // ✅ get current theme

  // Refresh user profile
  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUser(res.data); // Update user state including avatar
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch profile");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("Please select a file");

    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const res = await api.post("/auth/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      toast.success(res.data.message || "Avatar updated successfully");
      fetchProfile(); // Refresh profile to show new avatar immediately
      setSelectedFile(null); // Clear selected file
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Theme-based styles
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white";
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-900";
  const subTextColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const buttonActive = theme === "dark" ? "bg-purple-700 hover:bg-purple-800" : "bg-purple-600 hover:bg-purple-700";

  return (
    <div className={`max-w-2xl mx-auto mt-10 p-6 rounded-xl shadow-md transition-colors duration-300 ${bgColor}`}>
      <ToastContainer />
      <img
        src={user.avatar || "/default-avatar.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto"
      />
      <h2 className={`text-2xl font-bold text-center mt-4 ${textColor}`}>{user.name}</h2>
      <p className={`text-center ${subTextColor}`}>{user.email}</p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={`text-sm sm:text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
        />
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className={`px-4 py-2 rounded text-white transition-colors duration-300 
            ${loading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : buttonActive}`}
        >
          {loading ? "Uploading..." : "Update Avatar"}
        </button>
      </div>
    </div>
  );
}
