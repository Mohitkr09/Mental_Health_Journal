import { useMemo, useState, useEffect, useRef } from "react";
import { useJournal } from "../context/JournalContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Loader2,
  Heart,
  HandHelping,
  Send,
  Mic,
  Play,
  StopCircle,
  Edit3,
  Trash2,
} from "lucide-react";

export default function Insights() {
  const { entries, loading: contextLoading, error: contextError } = useJournal();
  const { theme } = useTheme();

  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // ===== Fetch Community Posts =====
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/community/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setCommunityPosts(
          res.data.sort(
            (a, b) =>
              new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          )
        );
      }
    } catch (err) {
      console.error("Error fetching community posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  // ===== Handle Posting =====
  const handlePost = async (textOverride = null) => {
    const content = textOverride || newPost.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/community/share`,
        { text: content, mood: "neutral" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data) {
        setCommunityPosts((prev) => [res.data, ...prev]);
        setNewPost("");
      }
    } catch (err) {
      console.error("Error posting:", err);
      alert("Failed to post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // ===== React to Post =====
  const handleReact = async (postId, type) => {
    try {
      setCommunityPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: {
                  ...post.likes,
                  [type]: (post.likes?.[type] || 0) + 1,
                },
              }
            : post
        )
      );
      await axios.post(
        `${API_BASE_URL}/api/auth/community/react`,
        { postId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("React error:", err);
    }
  };

  // ===== Edit Post =====
  const saveEdit = async (postId) => {
    if (!editingText.trim()) return;
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/auth/community/posts/${postId}`,
        { text: editingText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommunityPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data : p))
      );
      setEditingPostId(null);
      setEditingText("");
    } catch (err) {
      console.error("Edit error:", err);
      alert("Failed to save edit.");
    }
  };

  // ===== Delete Post =====
  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/auth/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommunityPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete post.");
    }
  };

  // ===== Voice Recording =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
      else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";
      else throw new Error("No supported audio MIME type for recording.");

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        await transcribeAndPost(blob);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access denied or unsupported browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ===== Transcribe and Post Automatically =====
  const transcribeAndPost = async (blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/voice-transcribe`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.text) {
        const text = res.data.text.trim();
        if (text) await handlePost(text);
      } else {
        alert("Transcription returned empty text.");
      }
    } catch (err) {
      console.error("Transcription error:", err.response?.data || err.message);
      alert("Voice transcription failed. Check server logs.");
    } finally {
      setTranscribing(false);
    }
  };

  const playAudio = () => {
    if (!audioBlob) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
    }
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
    audio.onended = () => {
      setPlaying(false);
      URL.revokeObjectURL(url);
    };
  };

  // ===== Charts =====
  const moodScale = { sad: 1, tired: 2, neutral: 3, anxious: 4, angry: 5, happy: 6 };
  const [selectedMood, setSelectedMood] = useState("all");

  const filteredEntries = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    return entries.filter(
      (item) => item.mood && (selectedMood === "all" || item.mood === selectedMood)
    );
  }, [entries, selectedMood]);

  const lineData = useMemo(() => {
    const grouped = {};
    filteredEntries.forEach((item) => {
      const date = new Date(item.date || item.createdAt).toLocaleDateString();
      grouped[date] = {
        date,
        moodValue: moodScale[item.mood] || 3,
        moodLabel: item.mood,
      };
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredEntries]);

  const moodDistribution = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    const counts = {};
    entries.forEach((item) => {
      if (item.mood) counts[item.mood] = (counts[item.mood] || 0) + 1;
    });
    return Object.keys(moodScale).map((mood) => ({
      mood,
      count: counts[mood] || 0,
    }));
  }, [entries]);

  const chartBg = theme === "dark" ? "#1f2937" : "#ffffff";
  const textColor = theme === "dark" ? "#f3f4f6" : "#111827";

  if (contextLoading)
    return <p className="text-center text-gray-500 mt-8 animate-pulse">⏳ Loading insights...</p>;
  if (contextError)
    return <p className="text-center text-red-500 mt-8">{contextError}</p>;

  // ====== Animated UI ======
  return (
    <div
      className={`max-w-5xl mx-auto px-4 min-h-screen transition-colors duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100"
          : "bg-gradient-to-b from-purple-50 to-white text-gray-900"
      } animate-fadeIn`}
    >
      <style>
        {`
          @keyframes fadeIn { from {opacity:0; transform:translateY(10px);} to {opacity:1; transform:translateY(0);} }
          .animate-fadeIn { animation: fadeIn 0.6s ease-in-out; }
          button:hover { box-shadow: 0 0 10px rgba(147, 51, 234, 0.4); }
        `}
      </style>

      {/* ===== Community Wall ===== */}
      <section
        className="p-6 rounded-2xl shadow-lg mb-16 border border-gray-300 dark:border-gray-700 hover:shadow-blue-400/30 transition-all duration-500 transform hover:scale-[1.02] backdrop-blur-sm bg-opacity-70"
        style={{ backgroundColor: chartBg }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🌐 Community Wall
        </h3>

        {/* Input Area */}
        <div className="flex mb-4 items-start gap-2">
          <textarea
            className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none transition-all"
            rows={2}
            placeholder="Share your thoughts..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <button
            onClick={() => handlePost()}
            disabled={posting || !newPost.trim()}
            className="p-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full hover:shadow-lg hover:shadow-purple-400/40 hover:scale-110 transition disabled:opacity-50"
          >
            {posting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Voice Buttons */}
        <div className="flex mb-6 space-x-4 items-center">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition transform hover:scale-110 ${
              recording ? "bg-red-500 animate-pulse shadow-red-400/50" : "bg-green-500"
            } text-white shadow-md hover:shadow-lg`}
          >
            {recording ? <StopCircle /> : <Mic />}
          </button>
          {audioBlob && (
            <button
              onClick={playAudio}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 hover:scale-110 shadow-md transition"
            >
              {playing ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
          )}
          {transcribing && (
            <p className="text-gray-400 text-sm animate-pulse">Transcribing your voice...</p>
          )}
        </div>

        {/* Posts */}
        {loadingPosts ? (
          <p className="text-gray-500 animate-pulse">Loading community posts...</p>
        ) : communityPosts.length === 0 ? (
          <p className="text-gray-400 italic">No posts yet. Be the first to share!</p>
        ) : (
          <div className="space-y-4">
            {communityPosts.map((post) => (
              <div
                key={post._id}
                className="p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-purple-400/20 transition-all duration-500 transform hover:scale-[1.01]"
              >
                {editingPostId === post._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={() => saveEdit(post._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-base leading-relaxed">{post.text}</p>

                    {/* ===== Interactive Buttons ===== */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleReact(post._id, "support")}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{post.likes?.support || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReact(post._id, "relate")}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        >
                          <HandHelping className="h-4 w-4" />
                          <span>{post.likes?.relate || 0}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingPostId(post._id);
                            setEditingText(post.text);
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => deletePost(post._id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-red-700 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>

                      <span className="text-gray-400 text-xs ml-auto">
                        {new Date(post.date || post.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
