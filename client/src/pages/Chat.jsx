import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Mic, MicOff, Volume2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Chat() {
  const { theme } = useTheme();

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);

  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  /* LOAD CHAT */
  useEffect(() => {
    const saved = localStorage.getItem("mindcare_chat");
    if (saved) setChatHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("mindcare_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  /* AUTO SCROLL */
  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory, loading]);

  /* VOICE */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
  }, []);

  const sendMessage = async (customMessage) => {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    const userMessage = {
      sender: "user",
      text: finalMessage,
      time: Date.now(),
    };

    const updated = [...chatHistory, userMessage];
    setChatHistory(updated);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: finalMessage }),
      });

      const data = await res.json();
      const aiReply = data.reply || "I'm here for you 💙";

      const aiMessage = {
        sender: "ai",
        text: aiReply,
        time: Date.now(),
      };

      setChatHistory([...updated, aiMessage]);

      if (speakEnabled) {
        const utter = new SpeechSynthesisUtterance(aiReply);
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setChatHistory([
        ...updated,
        { sender: "ai", text: "⚠️ AI unavailable" },
      ]);
    }

    setMessage("");
    setLoading(false);
  };

  const startRecording = () => {
    recognitionRef.current?.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  /* MESSAGE */
  const ChatMessage = ({ sender, text, time }) => {
    const isUser = sender === "user";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div className="flex items-end gap-3 max-w-[80%]">

          {!isUser && (
            <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
          )}

          <div
            className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow ${
              isUser
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                : theme === "dark"
                ? "bg-gray-800 text-gray-100"
                : "bg-white border"
            }`}
          >
            <p className="whitespace-pre-wrap">{text}</p>

            <div className="text-[10px] opacity-50 mt-1 text-right">
              {new Date(time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {isUser && (
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  /* TYPING */
  const TypingIndicator = () => (
    <div className="flex gap-1 pl-12">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
    </div>
  );

  return (
    <div
      className={`h-screen flex flex-col ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-b from-gray-50 to-white"
      }`}
    >
      {/* HEADER */}
      <div className="border-b px-4 py-3 text-center font-semibold bg-white dark:bg-gray-900">
        MindCare Assistant
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-8 space-y-6 pb-32"
      >
        {chatHistory.length === 0 && (
          <div className="text-center mt-32 opacity-70">
            <Bot size={50} className="mx-auto mb-4 text-purple-500" />
            <p className="text-lg font-semibold">Start a conversation</p>
            <p className="text-sm">Your AI is here to help 💬</p>
          </div>
        )}

        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}
        </AnimatePresence>

        {loading && <TypingIndicator />}
      </div>

      {/* INPUT */}
      <div className="border-t bg-white dark:bg-gray-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Message MindCare..."
            className="flex-1 px-5 py-3 rounded-full bg-gray-100 dark:bg-gray-800 outline-none"
          />

          <button
            onClick={() => sendMessage()}
            className="p-3 rounded-full bg-purple-600 text-white hover:scale-105 transition"
          >
            <Send size={18} />
          </button>

          <button
            onClick={() => setSpeakEnabled(!speakEnabled)}
            className={`p-3 rounded-full ${
              speakEnabled
                ? "bg-green-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <Volume2 size={18} />
          </button>

        </div>
      </div>
    </div>
  );
}