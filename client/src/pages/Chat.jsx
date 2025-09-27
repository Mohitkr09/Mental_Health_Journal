// src/pages/Chat.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx"; // ✅ Import ThemeContext

const moods = [
  { label: "😊", value: "happy" },
  { label: "😔", value: "sad" },
  { label: "😡", value: "angry" },
  { label: "😰", value: "anxious" },
  { label: "😴", value: "tired" },
];

export default function Chat() {
  const { theme } = useTheme(); // ✅ Get current theme
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newHistory = [...chatHistory, { sender: "user", text: message }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mood }),
      });

      const data = await res.json();
      setChatHistory([
        ...newHistory,
        { sender: "ai", text: data.reply || "I’m here for you 💙" },
      ]);
    } catch (err) {
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

  const ChatMessage = ({ sender, text }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 my-2 sm:my-3 ${
        sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {sender === "ai" && (
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${
            theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-300"
          }`}
        >
          <Bot size={18} />
        </div>
      )}
      <div
        className={`p-2 sm:p-3 rounded-2xl shadow-md max-w-[75%] sm:max-w-[70%] md:max-w-[60%] ${
          sender === "user"
            ? theme === "dark"
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-blue-600 text-white rounded-br-none"
            : theme === "dark"
            ? "bg-gray-800 text-gray-200 rounded-bl-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        {text}
      </div>
      {sender === "user" && (
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${
            theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
          }`}
        >
          <User size={18} />
        </div>
      )}
    </motion.div>
  );

  return (
    <div
      className={`flex flex-col h-screen p-2 sm:p-4 ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-b from-blue-50 to-white text-gray-900"
      }`}
    >
      {/* Centered container for larger screens */}
      <div className="flex-1 flex justify-center">
        <div className="flex flex-col w-full max-w-2xl">
          {/* Mood Selector */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`text-xl sm:text-2xl transition transform hover:scale-125 ${
                  mood === m.value ? "scale-125" : ""
                } ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 overflow-y-auto p-3 sm:p-4 rounded-lg shadow-inner border ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <AnimatePresence>
              {chatHistory.map((msg, idx) => (
                <ChatMessage key={idx} sender={msg.sender} text={msg.text} />
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 italic">
                <Bot size={16} />
                <span className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="flex mt-3 sm:mt-4 gap-2">
            <input
              type="text"
              value={message}
              placeholder="Type your message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className={`flex-1 p-2 sm:p-3 border rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
                  : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"
              }`}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className={`p-2 sm:p-3 rounded-full shadow hover:bg-blue-700 transition disabled:opacity-50 ${
                theme === "dark" ? "bg-blue-500 text-white" : "bg-blue-600 text-white"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
