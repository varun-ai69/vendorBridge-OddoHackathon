export const lightThemeColors = {
  primary: "#4f46e5", // Indigo
  primaryDark: "#3730a3",
  secondary: "#0d9488", // Teal
  accent: "#f59e0b", // Amber
  background: "#f8fafc", // Cool Slate white
  surface: "#ffffff",
  surfaceBorder: "#e2e8f0",
  text: "#0f172a", // Dark Slate
  textMuted: "#64748b",
  success: "#10b981", // Emerald
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0ea5e9",
  cardBg: "#ffffff",
  shadowColor: "#0f172a",
};

export const darkThemeColors = {
  primary: "#6366f1", // Light Indigo
  primaryDark: "#4f46e5",
  secondary: "#14b8a6", // Teal
  accent: "#fbbf24", // Amber
  background: "#0f172a", // Obsidian dark
  surface: "#1e293b", // Slate surface
  surfaceBorder: "#334155",
  text: "#f8fafc", // Cool Slate white text
  textMuted: "#94a3b8",
  success: "#34d399", // Emerald light
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#38bdf8",
  cardBg: "#1e293b",
  shadowColor: "#000000",
};

export type ThemeColors = typeof lightThemeColors;
