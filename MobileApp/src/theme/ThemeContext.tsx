import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { lightThemeColors, darkThemeColors, ThemeColors } from "./colors";

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORE_KEY = "user_theme_preference";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === "dark");

  useEffect(() => {
    // Load persisted preference on mount
    const loadThemePreference = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_STORE_KEY);
        if (savedTheme) {
          setIsDark(savedTheme === "dark");
        } else {
          setIsDark(systemScheme === "dark");
        }
      } catch (error) {
        console.warn("Failed to load theme preference from SecureStore", error);
      }
    };
    loadThemePreference();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      await SecureStore.setItemAsync(THEME_STORE_KEY, nextDark ? "dark" : "light");
    } catch (error) {
      console.warn("Failed to save theme preference in SecureStore", error);
    }
  };

  const colors = isDark ? darkThemeColors : lightThemeColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
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
