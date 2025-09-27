// src/components/ChatButton.jsx
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx"; 

export default function ChatButton() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleClick = () => {
    navigate("/chat");
  };

  
  const bgColor = theme === "dark" ? "bg-purple-800 hover:bg-purple-700" : "bg-purple-600 hover:bg-purple-700";
  const textColor = "text-white";

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg ${bgColor} ${textColor} transition-all duration-300`}
      title="Open Chat"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
