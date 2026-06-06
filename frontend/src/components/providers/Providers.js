"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import CursorGlow from "@/components/ui/CursorGlow";

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <AuthProvider>
        <CursorGlow />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
