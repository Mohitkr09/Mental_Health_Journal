import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../utils/api.js"; // Assuming you have an API util

export default function CommunityWall() {
  const { theme } = useTheme();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch community posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/community/posts"); // Replace with your endpoint
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load community posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create a new post
  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      const res = await api.post("/community/posts", { content: newPost });
      setPosts([res.data, ...posts]); // Prepend new post
      setNewPost("");
    } catch {
      alert("Failed to post. Try again!");
    }
  };

  if (loading) return <p className="text-center text-gray-500">⏳ Loading community...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className={`p-6 rounded-xl shadow-md mb-10 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-purple-300" : "text-purple-700"}`}>
        🌐 Community Wall
      </h3>

      <div className="mb-4 flex flex-col md:flex-row gap-2">
        <textarea
          className="flex-1 p-2 border rounded-md focus:outline-none"
          style={{ backgroundColor: theme === "dark" ? "#1f2937" : "#f9fafb", color: theme === "dark" ? "#f3f4f6" : "#111827" }}
          rows={3}
          placeholder="Share your mood or insights..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button
          onClick={handlePost}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Post
        </button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && <p className="text-gray-500">No community posts yet.</p>}
        {posts.map((post, idx) => (
          <div key={idx} className={`p-4 rounded-md ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
            <p className="text-sm mb-1">{post.content}</p>
            <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
