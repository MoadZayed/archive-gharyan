import React, { createContext, useContext, useEffect, useState } from "react";

type GenderTheme = "male" | "female";

interface GenderContextType {
  genderTheme: GenderTheme;
  toggleGender: () => void;
  setGender: (theme: GenderTheme) => void;
}

const GenderContext = createContext<GenderContextType | undefined>(undefined);

export const GenderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [genderTheme, setGenderTheme] = useState<GenderTheme>(() => {
    const saved = localStorage.getItem("genderTheme");
    return (saved as GenderTheme) || "female";
  });

  useEffect(() => {
    localStorage.setItem("genderTheme", genderTheme);
    document.documentElement.setAttribute("data-gender", genderTheme);
  }, [genderTheme]);

  const toggleGender = () => {
    setGenderTheme((prev) => (prev === "male" ? "female" : "male"));
  };

  const setGender = (theme: GenderTheme) => {
    setGenderTheme(theme);
  };

  return (
    <GenderContext.Provider value={{ genderTheme, toggleGender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
};

export const useGender = () => {
  return { genderTheme: 'female' as GenderTheme, toggleGender: () => {}, setGender: () => {} };
};
