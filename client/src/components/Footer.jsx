// src/components/Footer.jsx
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Footer() {
  const { theme } = useTheme();

  // ✅ Theme-based background
  const bgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600";

  const textClass = theme === "dark" ? "text-gray-200" : "text-white";
  const headingClass = theme === "dark" ? "text-white" : "text-white font-semibold";
  const linkHoverClass = theme === "dark" ? "hover:text-purple-300" : "hover:text-purple-200";
  const borderClass = theme === "dark" ? "border-gray-600" : "border-purple-300";

  return (
    <footer className={`${bgClass} ${textClass} mt-16 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Column 1 */}
          <div>
            <h3 className={`text-lg mb-4 ${headingClass}`}>How to Start Journaling</h3>
            <ul className="space-y-2 text-sm">
              {[
                "Self Reflection 101",
                "Gratitude Journaling",
                "Benefits of Journaling",
                "Journaling with a Coach and Therapist",
                "Shadow Work Journal",
                "Diary Vs Journal",
              ].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className={`transition ${linkHoverClass}`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className={`text-lg mb-4 ${headingClass}`}>Journaling Prompts & Guides</h3>
            <ul className="space-y-2 text-sm">
              {[
                "Journal Prompts for Anxiety & Depression",
                "Journal Prompts for Health & Wellness",
                "Journal Prompts for Creativity",
                "Journal Prompts for Personal Growth",
              ].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className={`transition ${linkHoverClass}`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className={`text-lg mb-4 ${headingClass}`}>More Journals</h3>
            <ul className="space-y-2 text-sm">
              {[
                "Write to Your Future Self",
                "Decision Journal",
                "Questions for Transitions",
                "Journal Questions for Relationships",
                "Journal Prompts for Confidence",
              ].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className={`transition ${linkHoverClass}`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className={`border ${borderClass} mb-6`} />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} SoulScribe Inc. All rights reserved.</p>

          {/* Links */}
          <div className="flex space-x-6">
            {["Contact Us", "Terms & Privacy Policy", "Affiliate Program Terms"].map((item, idx) => (
              <a key={idx} href="#" className={`transition ${linkHoverClass}`}>{item}</a>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={`transition ${linkHoverClass}`}>
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`transition ${linkHoverClass}`}>
              <Github className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={`transition ${linkHoverClass}`}>
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`transition ${linkHoverClass}`}>
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
