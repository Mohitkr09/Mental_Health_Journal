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

  // ====== Animated UI =======
  return (
    <div
      className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen transition-colors duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100"
          : "bg-gradient-to-b from-purple-50 to-white text-gray-900"
      }`}
    >
      {/* Community Wall */}
      <section
        className="p-4 sm:p-6 rounded-2xl shadow-lg mb-16 border border-gray-300 dark:border-gray-700 bg-opacity-80 backdrop-blur-sm"
        style={{ backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff" }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🌐 Community Wall
        </h3>

        {/* Responsive Input Area */}
        <div className="flex flex-col sm:flex-row mb-4 gap-3">
          <textarea
            className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none"
            rows={2}
            placeholder="Share your thoughts..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />

          <button
            onClick={() => handlePost()}
            disabled={posting || !newPost.trim()}
            className="p-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-full hover:scale-105 transition disabled:opacity-50 self-end sm:self-center"
          >
            {posting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        {/* Voice Buttons */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-4 rounded-full ${
              recording ? "bg-red-500 animate-pulse" : "bg-green-500"
            } text-white shadow`}
          >
            {recording ? <StopCircle /> : <Mic />}
          </button>

          {audioBlob && (
            <button
              onClick={playAudio}
              className="p-4 rounded-full bg-blue-500 text-white shadow hover:bg-blue-600"
            >
              {playing ? <Loader2 className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}

          {transcribing && <p className="text-gray-400 text-sm animate-pulse">Transcribing…</p>}
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
                className="p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
              >
                {editingPostId === post._id ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(post._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPostId(null)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-base leading-relaxed">{post.text}</p>

                    <div className="flex flex-wrap items-center justify-between mt-3 gap-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleReact(post._id, "support")}
                          className="flex items-center gap-1 px-3 py-1 bg-pink-500 text-white rounded-full"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{post.likes?.support || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReact(post._id, "relate")}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full"
                        >
                          <HandHelping className="h-4 w-4" />
                          <span>{post.likes?.relate || 0}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingPostId(post._id);
                            setEditingText(post.text);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-full"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => deletePost(post._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>

                      <span className="text-gray-400 text-xs">
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
