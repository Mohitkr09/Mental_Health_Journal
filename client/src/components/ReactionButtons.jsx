import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

export default function ReactionButtons({ post, onReact }) {
  const { token } = useAuth();

  const handleReact = async (type) => {
    try {
      const { data } = await axios.post(
        "/api/auth/community/react",
        { postId: post._id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onReact) onReact(data); // Update parent component
    } catch (err) {
      console.error("❌ Failed to react:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex gap-4 mt-2">
      <button
        onClick={() => handleReact("support")}
        className="flex items-center gap-1 text-gray-600 hover:text-blue-500"
      >
        💬 {post.support || 0}
      </button>
      <button
        onClick={() => handleReact("relate")}
        className="flex items-center gap-1 text-gray-600 hover:text-red-500"
      >
        ❤️ {post.relate || 0}
      </button>
    </div>
  );
}
