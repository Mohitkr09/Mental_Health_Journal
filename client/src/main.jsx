// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/Authcontext.jsx";
import { JournalProvider } from "./context/JournalContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <JournalProvider>
          <App />
        </JournalProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
