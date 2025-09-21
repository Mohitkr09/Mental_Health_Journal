import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import Swal from "sweetalert2"; // 👈 install with `npm install sweetalert2`

export default function Navbar({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // 🔐 Logout with confirmation
  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Logout",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
      }
    });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-10 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300"
        >
          MindCare 🌱
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 dark:text-gray-200">
          {["/", "/journal", "/insights", "/chat"].map((path, i) => {
            const labels = ["Home", "Journal", "Insights", "Chat"];
            return (
              <Link
                key={i}
                to={path}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                {labels[i]}
              </Link>
            );
          })}

          {/* Get the App Button */}
          <Link
            to="/app"
            className="px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition shadow-md text-sm lg:text-base"
          >
            Get the App
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            {theme === "light" ? (
              <>
                <Moon size={16} /> Dark
              </>
            ) : (
              <>
                <Sun size={16} /> Light
              </>
            )}
          </button>

          {/* Profile Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 transition"
              >
                <img
                  src={user.avatar || "/default-avatar.png"}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden sm:inline">{user.name}</span>
                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg py-2 flex flex-col text-gray-700 dark:text-gray-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 block">
                      {user.email}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 dark:text-gray-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5 flex flex-col gap-4 text-gray-700 dark:text-gray-200 md:hidden z-50">
          {["/", "/journal", "/insights", "/chat"].map((path, i) => {
            const labels = ["Home", "Journal", "Insights", "Chat"];
            return (
              <Link
                key={i}
                to={path}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                {labels[i]}
              </Link>
            );
          })}

          <Link
            to="/app"
            className="px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition text-center shadow-md"
            onClick={() => setMenuOpen(false)}
          >
            Get the App
          </Link>

          {/* Mobile Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            {theme === "light" ? (
              <>
                <Moon size={16} /> Dark
              </>
            ) : (
              <>
                <Sun size={16} /> Light
              </>
            )}
          </button>

          {/* Mobile Profile */}
          {user && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col gap-2">
              <div className="px-2 py-1">
                <span className="font-semibold">{user.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 block">
                  {user.email}
                </span>
              </div>
              <Link
                to="/profile"
                className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-left hover:text-purple-600 dark:hover:text-purple-400"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
