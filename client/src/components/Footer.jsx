// src/components/Footer.jsx
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 text-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Column 1 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">How to Start Journaling</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-300 transition">Self Reflection 101</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Gratitude Journaling</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Benefits of Journaling</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journaling with a Coach and Therapist</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Shadow Work Journal</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Diary Vs Journal</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Journaling Prompts & Guides</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-300 transition">Journal Prompts for Anxiety & Depression</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journal Prompts for Health & Wellness</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journal Prompts for Creativity</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journal Prompts for Personal Growth</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">More Journals</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-300 transition">Write to Your Future Self</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Decision Journal</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Questions for Transitions</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journal Questions for Relationships</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Journal Prompts for Confidence</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-600 mb-6" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} SoulScribe Inc. All rights reserved.</p>
          
          {/* Links */}
          <div className="flex space-x-6">
            <a href="#" className="hover:text-purple-300 transition">Contact Us</a>
            <a href="#" className="hover:text-purple-300 transition">Terms & Privacy Policy</a>
            <a href="#" className="hover:text-purple-300 transition">Affiliate Program Terms</a>
          </div>

          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
