import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  PlusJakartaSans_400Regular, 
  PlusJakartaSans_500Medium, 
  PlusJakartaSans_600SemiBold, 
  PlusJakartaSans_700Bold 
} from '@expo-google-fonts/plus-jakarta-sans';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Suppress known third-party library warnings
LogBox.ignoreLogs([
  "InteractionManager has been deprecated",
]);

import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { ErrorBoundary } from "./src/components/feedback/ErrorBoundary";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/store/authStore";

function MainApp() {
  const { isDark } = useTheme();
  const { hydrateAuth } = useAuthStore();

  // Load auth state from Secure Store on app startup
  useEffect(() => {
    hydrateAuth();
  }, []);

  return (
    <ErrorBoundary>
      <AppNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
      <Toast />
    </ErrorBoundary>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
