import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboardService";

const StatCard = ({ icon, label, value, color }: any) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
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
        <StatCard icon="file-edit-outline" label="Active RFQs" value={data?.my_active_rfqs ?? "—"} color={colors.primary} />
        <StatCard icon="clock-outline" label="Pending Approvals" value={data?.my_pending_approvals ?? "—"} color={colors.warning} />
        <StatCard icon="receipt-outline" label="POs This Month" value={data?.my_pos_this_month ?? "—"} color={colors.secondary} />
        <StatCard icon="email-check-outline" label="Quotes Today" value={data?.quotations_received_today ?? "—"} color={colors.info} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => navigation.navigate("RFQs", { screen: "RFQCreate" })}
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#fff" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Create New RFQ</Text>
          <Text style={styles.actionSub}>Request quotations from approved vendors</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.secondary, shadowColor: colors.secondary }]}
        onPress={() => navigation.navigate("RFQs", { screen: "RFQList" })}
      >
        <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#fff" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>View All RFQs</Text>
          <Text style={styles.actionSub}>Manage open, closed & awarded RFQs</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        onPress={() => navigation.navigate("Orders", { screen: "POList" })}
      >
        <MaterialCommunityIcons name="file-document-outline" size={24} color="#fff" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Purchase Orders</Text>
          <Text style={styles.actionSub}>Track POs and manage invoices</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  role: { fontSize: 13, fontWeight: "600" },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: {
    width: "47%", borderRadius: 12, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  actionCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    borderRadius: 14, marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  actionText: { flex: 1 },
  actionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  actionSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
});
