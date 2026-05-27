import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { gender, mode, setGender, toggleMode } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Gender Toggle */}
      <div 
        className="flex items-center p-1 rounded-full border shadow-sm transition-colors duration-300"
        style={{ backgroundColor: "var(--glass-white)", borderColor: "var(--border-pink)" }}
      >
        <button
          onClick={() => setGender("male")}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${gender === "male" ? "shadow-md scale-105" : "opacity-60 hover:opacity-100"}`}
          style={{ 
            backgroundColor: gender === "male" ? "var(--accent-primary)" : "transparent",
            color: gender === "male" ? "white" : "var(--text-primary)"
          }}
          aria-label="Male Theme"
        >
          {/* Person Icon Male */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button
          onClick={() => setGender("female")}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${gender === "female" ? "shadow-md scale-105" : "opacity-60 hover:opacity-100"}`}
          style={{ 
            backgroundColor: gender === "female" ? "var(--accent-primary)" : "transparent",
            color: gender === "female" ? "white" : "var(--text-primary)"
          }}
          aria-label="Female Theme"
        >
          {/* Person Icon Female (or distinct) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 21v-2a4 4 0 0 0-4-4H9" />
            <path d="M15 15h.01" />
            <path d="M19 21v-2a4 4 0 0 0-4-4" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleMode}
        className="flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
        style={{ 
          backgroundColor: "var(--glass-white)", 
          borderColor: "var(--border-pink)",
          color: "var(--text-primary)"
        }}
        aria-label="Toggle Dark/Light Mode"
      >
        {mode === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}
