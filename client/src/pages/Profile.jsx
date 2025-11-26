import { useState } from "react";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Camera } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  if (!user) return null;

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUser(res.data);
    } catch {
      toast.error("Failed to fetch profile");
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

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
      fetchProfile();
      setSelectedFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`max-w-xl mx-auto mt-14 p-8 rounded-3xl border backdrop-blur-lg shadow-xl transition-colors ${
        isDark
          ? "bg-gray-900/60 border-gray-700 text-gray-200"
          : "bg-white/70 border-gray-200 text-gray-900"
      }`}
    >
      <ToastContainer />

      {/* Avatar with hover glow */}
      <div className="relative group w-32 h-32 mx-auto">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt="Profile"
          className="w-32 h-32 rounded-full shadow-md object-cover border-2 border-purple-500 group-hover:scale-105 transition-transform"
        />

        <label
          htmlFor="avatar"
          className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-purple-700 transition-all"
        >
          <Camera size={20} />
        </label>

        <input
          id="avatar"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <h2 className="text-3xl font-semibold text-center mt-4 tracking-tight">
        {user.name}
      </h2>
      <p className={`text-center text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        {user.email}
      </p>

      {/* Upload Zone */}
      <div
        className={`mt-8 p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          selectedFile
            ? "border-green-500 bg-green-50 dark:bg-green-900/30"
            : isDark
            ? "border-gray-600"
            : "border-gray-300"
        } hover:border-purple-500`}
        onClick={() => document.getElementById("avatar").click()}
      >
        <p className="text-center text-sm">
          {selectedFile ? `Selected: ${selectedFile.name}` : "Click to upload a new profile image"}
        </p>
      </div>

      {/* Action Button */}
      <button
        disabled={loading || !selectedFile}
        onClick={handleUpload}
        className={`mt-6 w-full py-3 rounded-xl font-medium transition-all ${
          loading || !selectedFile
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg active:scale-95"
        }`}
      >
        {loading ? "Uploading..." : "Update Avatar"}
      </button>

      {/* Fun visual detail */}
      <p className="text-center text-xs mt-4 opacity-60">
        Be uniquely YOU — personalize your profile ✨
      </p>
    </div>
  );
}
