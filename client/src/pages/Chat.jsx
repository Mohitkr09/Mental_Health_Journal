import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const moods = [
  { label: "😊", value: "happy" },
  { label: "😔", value: "sad" },
  { label: "😡", value: "angry" },
  { label: "😰", value: "anxious" },
  { label: "😴", value: "tired" },
];

export default function Chat() {
  const { theme } = useTheme();

  // 🎯 State
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [speakEnabled, setSpeakEnabled] = useState(false);

  const chatContainerRef = useRef(null);
  const lastMessageTypeRef = useRef("user");

  // 🔁 Auto-scroll to latest message
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNewMessage = chatHistory.at(-1)?.sender !== lastMessageTypeRef.current;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isNewMessage ? "smooth" : "instant",
    });

    lastMessageTypeRef.current = chatHistory.at(-1)?.sender;
  }, [chatHistory, message, loading]);

  // 🎙️ Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setAudioChunks([]);
        await handleVoiceUpload(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Please allow microphone permissions to record your voice.");
    }
  };

  // ⏹️ Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  // 🧠 Handle voice upload + transcription
  const handleVoiceUpload = async (audioBlob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      // ✅ Backend expects "file"
      formData.append("file", audioBlob, "voice.webm");

      const res = await fetch("http://localhost:5000/api/auth/voice-transcribe", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();

      const transcript = data.text?.trim() || "Unable to transcribe audio. Try again.";
      const updatedHistory = [...chatHistory, { sender: "user", text: transcript, mood }];
      setChatHistory(updatedHistory);

      // 🎯 Send transcript to chat endpoint
      const aiRes = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: transcript, mood }),
      });

      const aiData = await aiRes.json();
      const aiReply = aiData.reply || "I'm here for you 💙";

      const finalHistory = [...updatedHistory, { sender: "ai", text: aiReply }];
      setChatHistory(finalHistory);

      // 🔊 Optional voice output
      if (speakEnabled) {
        const synth = window.speechSynthesis;
        const utter = new SpeechSynthesisUtterance(aiReply);
        utter.rate = 1;
        utter.pitch = 1;
        synth.speak(utter);
      }
    } catch (err) {
      console.error("Voice chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Voice service unavailable. Try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 💬 Send text message
  const sendMessage = async (customMessage) => {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    const newHistory = [...chatHistory, { sender: "user", text: finalMessage, mood }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: finalMessage, mood }),
      });

      const data = await res.json();
      const aiReply = data.reply || "I’m here for you 💙";
      setChatHistory([...newHistory, { sender: "ai", text: aiReply }]);

      if (speakEnabled) {
        const synth = window.speechSynthesis;
        const utter = new SpeechSynthesisUtterance(aiReply);
        synth.speak(utter);
      }
    } catch (err) {
      console.error("Text chat error:", err);
      setChatHistory([
        ...newHistory,
        { sender: "ai", text: "⚠️ AI service unavailable, try later." },
      ]);
    } finally {
      setMessage("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  // 💭 Chat message bubble
  const ChatMessage = ({ sender, text }) => {
    const isUser = sender === "user";

    const bubbleBg = isUser
      ? theme === "dark"
        ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
        : "bg-gradient-to-r from-blue-500 to-purple-400 text-white"
      : theme === "dark"
      ? "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100"
      : "bg-gray-100 text-gray-900";

    const avatarColor = isUser
      ? theme === "dark"
        ? "bg-blue-600"
        : "bg-blue-500"
      : theme === "dark"
      ? "bg-gray-700"
      : "bg-gray-300";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-2 my-2 sm:my-3 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isUser && (
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${avatarColor}`}>
            <Bot size={18} />
          </div>
        )}
        <div
          className={`p-3 rounded-2xl shadow-md max-w-[75%] sm:max-w-[70%] md:max-w-[60%] ${bubbleBg} ${
            isUser ? "rounded-br-none" : "rounded-bl-none"
          }`}
        >
          {text}
        </div>
        {isUser && (
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${avatarColor}`}>
            <User size={18} />
          </div>
        )}
      </motion.div>
    );
  };

  // 🧩 UI Layout
  return (
    <div
      className={`flex flex-col h-screen p-2 sm:p-4 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-b from-blue-50 to-white text-gray-900"
      }`}
    >
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="flex flex-col w-full max-w-2xl">
          {/* Mood Selector */}
          <div className="flex justify-center gap-4 mb-4">
            {moods.map((m) => (
              <motion.button
                key={m.value}
                onClick={() => setMood(m.value)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className={`text-2xl p-2 rounded-full shadow-md transition-all ${
                  mood === m.value ? "ring-4 ring-purple-500" : ""
                } ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}
              >
                {m.label}
              </motion.button>
            ))}
          </div>

          {/* Chat Area */}
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto p-4 rounded-lg shadow-inner border ${
              theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <AnimatePresence>
              {chatHistory.map((msg, idx) => (
                <ChatMessage key={idx} sender={msg.sender} text={msg.text} />
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 italic">
                <Loader2 className="animate-spin" size={16} /> Thinking...
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="flex mt-3 sm:mt-4 gap-2 items-center sticky bottom-0 bg-inherit pb-2 pt-2">
            {/* 🎙️ Mic Button */}
            <motion.button
              onClick={recording ? stopRecording : startRecording}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-full shadow-lg ${
                recording
                  ? "bg-red-500 text-white animate-pulse"
                  : theme === "dark"
                  ? "bg-gray-700 text-purple-300"
                  : "bg-gray-200 text-purple-700"
              }`}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>

            {/* Text Input */}
            <input
              type="text"
              value={message}
              placeholder="Type or speak your message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className={`flex-1 p-3 border rounded-full shadow focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base transition-colors ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
                  : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"
              }`}
            />

            {/* Send Button */}
            <motion.button
              onClick={() => sendMessage()}
              disabled={loading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-full shadow-lg ${
                theme === "dark" ? "bg-purple-500 text-white" : "bg-purple-600 text-white"
              }`}
            >
              <Send size={20} />
            </motion.button>

            {/* 🔈 Voice Output Toggle */}
            <motion.button
              onClick={() => setSpeakEnabled((prev) => !prev)}
              whileHover={{ scale: 1.1 }}
              title="Toggle AI voice reply"
              className={`p-3 rounded-full shadow-lg ${
                speakEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"
              }`}
            >
              <Volume2 size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
