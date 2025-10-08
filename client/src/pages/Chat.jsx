import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
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

    const newHistory = [...chatHistory, { sender: "user", text: message, mood }];
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

  const ChatMessage = ({ sender, text, mood }) => {
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

  return (
    <div
      className={`flex flex-col h-screen p-2 sm:p-4 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gradient-to-b from-blue-50 to-white text-gray-900"
      }`}
    >
      {/* Chat Container */}
      <div className="flex-1 flex justify-center">
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
                } ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}
              >
                {m.label}
              </motion.button>
            ))}
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 overflow-y-auto p-4 rounded-lg shadow-inner border ${
              theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <AnimatePresence>
              {chatHistory.map((msg, idx) => (
                <ChatMessage key={idx} sender={msg.sender} text={msg.text} mood={msg.mood} />
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
              className={`flex-1 p-3 border rounded-full shadow focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base transition-colors duration-300 ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
                  : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"
              }`}
            />
            <motion.button
              onClick={sendMessage}
              disabled={loading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-full shadow-lg transition-colors duration-200 disabled:opacity-50 ${
                theme === "dark" ? "bg-purple-500 text-white" : "bg-purple-600 text-white"
              }`}
            >
              <Send size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
