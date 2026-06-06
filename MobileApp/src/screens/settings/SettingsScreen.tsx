import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { LoadingButton } from "../../components/common/LoadingButton";

export const SettingsScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive", onPress: async () => {
          await clearAuth();
        }
      },
    ]);
  };

  const Section = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        {children}
      </View>
    </View>
  );

  const RowItem = ({ icon, label, value, onPress, right }: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + "15" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {value && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>}
      </View>
      {right ?? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.replace("_", " ").toUpperCase()}</Text>
        </View>
        <Text style={styles.orgText}>{user?.org_name}</Text>
      </View>

      {/* Preferences */}
      <Section title="Preferences">
        <RowItem
          icon={isDark ? "weather-night" : "white-balance-sunny"}
          label="Dark Mode"
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.primary }}
              thumbColor="#fff"
            />
          }
        />
        <RowItem
          icon="key-chain"
          label="Change Password"
          onPress={() => navigation.navigate("ChangePassword")}
        />
      </Section>

      {/* Account Info */}
      <Section title="Account">
        <RowItem icon="domain" label="Organization" value={user?.org_name} />
        <RowItem icon="shield-account" label="Role" value={user?.role?.replace("_", " ")} />
        <RowItem icon="phone" label="Phone" value={user?.phone ?? "Not set"} />
      </Section>

      {/* App Info */}
      <Section title="About">
        <RowItem icon="information-outline" label="Version" value="1.0.0 (Hackathon)" />
        <RowItem icon="code-braces" label="Built With" value="React Native · Expo" />
      </Section>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <LoadingButton
          label="Sign Out"
          variant="outline"
          onPress={handleLogout}
          buttonStyle={[styles.logoutBtn, { borderColor: colors.danger }]}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { padding: 28, alignItems: "center", paddingBottom: 32 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileEmail: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  roleBadge: {
    marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  orgText: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowValue: { fontSize: 12, marginTop: 2 },
  logoutSection: { padding: 16, marginTop: 24, marginBottom: 32 },
  logoutBtn: { height: 50 },
});
