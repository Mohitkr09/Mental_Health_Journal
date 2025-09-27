import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "./utils/api.js";

// Context
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { JournalProvider } from "./context/JournalContext.jsx";

// Components & Pages
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatButton from "./components/ChatButton.jsx"; // 🌟 Floating chat
import Home from "./pages/Home.jsx";
import Journal from "./pages/Journal.jsx";
import Insights from "./pages/Insights.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TopicDetail from "./pages/TopicDetail.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ✅ Fetch user profile on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err.response?.data?.message);
        localStorage.removeItem("token"); // clear invalid token
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // ----------------- Protected Route -----------------
  const ProtectedRoute = ({ children }) => {
    if (loading) return (
      <div className="text-center mt-20 text-gray-500 dark:text-gray-300">
        ⏳ Loading...
      </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    return children;
  };

  return (
    <Router>
      <ThemeProvider>
        <JournalProvider>
          <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
            
            {/* Navbar */}
            <header className="sticky top-0 z-50">
              <Navbar user={user} setUser={setUser} />
            </header>

            {/* Main Content */}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/topic/:id" element={<TopicDetail />} />

                <Route path="/journal" element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                } />

                <Route path="/insights" element={
                  <ProtectedRoute>
                    <Insights />
                  </ProtectedRoute>
                } />

                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile user={user} setUser={setUser} />
                  </ProtectedRoute>
                } />

                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/register" element={<Register setUser={setUser} />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* 🌟 Floating Chat Button */}
            {user && <ChatButton />}
          </div>
        </JournalProvider>
      </ThemeProvider>
    </Router>
  );
}
