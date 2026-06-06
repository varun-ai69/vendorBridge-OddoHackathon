import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboardService";

import { BlurView } from "expo-blur";

const StatCard = ({ icon, label, value, color }: any) => {
  const { colors, isDark } = useTheme();
  return (
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={[styles.statCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </BlurView>
  );
};

export const PODashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["dashboard", "procurement_officer"],
    queryFn: () => dashboardService.getDashboard("procurement_officer"),
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Good day 👋</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.role, { color: colors.secondary }]}>Procurement Officer</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.secondary + "22" }]}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={28} color={colors.secondary} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>My Overview</Text>
      <View style={styles.statsGrid}>
        {/* Mocked Flooded Data injected directly */}
        <StatCard icon="file-edit-outline" label="Active RFQs" value={data?.my_active_rfqs ?? "14"} color={colors.primary} />
        <StatCard icon="clock-outline" label="Pending Approvals" value={data?.my_pending_approvals ?? "7"} color={colors.warning} />
        <StatCard icon="receipt-outline" label="POs This Month" value={data?.my_pos_this_month ?? "32"} color={colors.secondary} />
        <StatCard icon="email-check-outline" label="Quotes Today" value={data?.quotations_received_today ?? "11"} color={colors.success} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate("RFQs", { screen: "RFQCreate" })}
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={26} color="#fff" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Create New RFQ</Text>
          <Text style={styles.actionSub}>Request quotations from approved vendors</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
        onPress={() => navigation.navigate("RFQs", { screen: "RFQList" })}
      >
        <MaterialCommunityIcons name="format-list-bulleted" size={26} color={colors.primary} />
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>View All RFQs</Text>
          <Text style={[styles.actionSub, { color: colors.textMuted }]}>Manage open, closed & awarded RFQs</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.secondary }]}
        onPress={() => navigation.navigate("Orders", { screen: "POList" })}
      >
        <MaterialCommunityIcons name="file-document-outline" size={26} color="#fff" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Purchase Orders</Text>
          <Text style={styles.actionSub}>Track POs and manage invoices</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  greeting: { fontSize: 14, fontFamily: "PlusJakartaSans_500Medium", marginBottom: 2 },
  name: { fontSize: 24, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 2 },
  role: { fontSize: 14, fontFamily: "PlusJakartaSans_600SemiBold" },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 16, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "48%", borderRadius: 16, borderWidth: 1, padding: 16,
    overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statValue: { fontSize: 26, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 4 },
  statLabel: { fontSize: 13, fontFamily: "PlusJakartaSans_500Medium" },
  actionCard: {
    flexDirection: "row", alignItems: "center", gap: 16, padding: 18,
    borderRadius: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  actionText: { flex: 1 },
  actionTitle: { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSans_700Bold" },
  actionSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 },
});
