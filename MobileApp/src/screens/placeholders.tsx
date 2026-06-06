/**
 * Placeholder screens — only the ones not yet implemented as full screens.
 * All other screens have been replaced with real implementations.
 */
import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { LoadingButton } from "../components/common/LoadingButton";
import { useAuthStore } from "../store/authStore";

const createPlaceholder = (name: string, icon: string = "cog") => {
  return () => {
    const { colors } = useTheme();
    const { clearAuth } = useAuthStore();

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.inner}
      >
        <MaterialCommunityIcons name={icon as any} size={52} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Coming soon — this screen is under development.
        </Text>
        <LoadingButton
          label="Sign Out"
          variant="outline"
          onPress={clearAuth}
          buttonStyle={styles.logoutButton}
        />
      </ScrollView>
    );
  };
};

// ── Remaining placeholder screens ──────────────────────────────────
export const ReportsAnalyticsScreen = createPlaceholder("Reports & Analytics", "chart-bar");
export const ChangePasswordScreen = createPlaceholder("Change Password", "lock-reset");

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  icon: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, marginBottom: 32, textAlign: "center", lineHeight: 22 },
  logoutButton: { marginTop: 20, width: 200 },
});
