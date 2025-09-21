// src/pages/TopicDetail.jsx
import { useParams, Link } from "react-router-dom";
import { journalingTopics } from "../data/journalingTopics.js";

export default function TopicDetail() {
  const { id } = useParams();
  const topic = journalingTopics.find((t) => t.id === id);

  if (!topic) {
    return <div className="text-center mt-20 text-red-500">Topic not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Image */}
        <img
          src={topic.image}
          alt={topic.title}
          className="w-full h-56 object-cover"
        />

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-3">{topic.title}</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            {topic.description}
          </p>

          {/* Action Button */}
          <button className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition shadow-md">
            {topic.action}
          </button>

          {/* Back to Home */}
          <div className="mt-6">
            <Link
              to="/"
              className="text-sm text-purple-600 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
