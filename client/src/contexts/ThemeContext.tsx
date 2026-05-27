import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export type GenderTheme = "male" | "female";
export type ModeTheme = "dark" | "light";

interface ThemeContextType {
  gender: GenderTheme;
  mode: ModeTheme;
  setGender: (gender: GenderTheme) => void;
  setMode: (mode: ModeTheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth(); // If available, although the hook might need the provider context differently depending on your app structure. We'll use the user safely.

  const [gender, setGenderState] = useState<GenderTheme>(() => {
    const saved = localStorage.getItem("gita-gender");
    if (saved === "male" || saved === "female") return saved;
    // Default fallback, could be detected from user profile
    if (user?.gender === "male") return "male";
    if (user?.gender === "female") return "female";
    return "male"; // default to male dark theme
  });

  const [mode, setModeState] = useState<ModeTheme>(() => {
    const saved = localStorage.getItem("gita-mode");
    if (saved === "dark" || saved === "light") return saved;
    return "dark"; // default to male dark theme
  });

  useEffect(() => {
    // Also try to detect gender from user if it becomes available and not set
    if (user && user.gender && !localStorage.getItem("gita-gender")) {
       setGenderState(user.gender === "female" ? "female" : "male");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("gita-gender", gender);
    document.documentElement.setAttribute("data-gender", gender);
  }, [gender]);

  useEffect(() => {
    localStorage.setItem("gita-mode", mode);
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const setGender = (newGender: GenderTheme) => {
    setGenderState(newGender);
  };

  const setMode = (newMode: ModeTheme) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ gender, mode, setGender, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};