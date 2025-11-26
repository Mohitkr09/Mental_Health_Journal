// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context Providers
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { JournalProvider } from "./context/JournalContext.jsx";

// Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatButton from "./components/ChatButton.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Journal from "./pages/Journal.jsx";
import Insights from "./pages/Insights.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TopicDetail from "./pages/TopicDetail.jsx";

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500 dark:text-gray-300">
        ⏳ Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// App Component
function AppContent() {
  const { user, setUser } = useAuth(); // <-- ✔ Inject user into Navbar

  return (
    <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-50">
        <Navbar user={user} setUser={setUser} /> {/* <-- ✔ FIXED */}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topic/:id" element={<TopicDetail />} />

          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Chat Button */}
      <ChatButton />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <JournalProvider>
            <AppContent />
          </JournalProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
