import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboardService";

const fmt = (n: number) =>
  `₹${n >= 1_00_000 ? (n / 1_00_000).toFixed(1) + "L" : n.toLocaleString("en-IN")}`;

export const VendorDashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["dashboard", "vendor"],
    queryFn: () => dashboardService.getDashboard("vendor"),
  });

  const kpis = [
    { icon: "email-open-outline", label: "Open RFQs", value: data?.active_rfqs_received ?? "—", color: colors.primary },
    { icon: "file-send-outline", label: "Quotes Submitted", value: data?.quotations_submitted ?? "—", color: colors.secondary },
    { icon: "trophy-outline", label: "Quotes Won", value: data?.quotations_accepted ?? "—", color: colors.success },
    { icon: "file-check-outline", label: "Active POs", value: data?.active_pos ?? "—", color: colors.accent },
    { icon: "receipt-text-outline", label: "Pending Invoices", value: data?.pending_invoices ?? "—", color: colors.warning },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Supplier Portal 🏪</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.orgName, { color: colors.primary }]}>{user?.org_name}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="store-outline" size={28} color={colors.primary} />
        </View>
      </View>

      {/* Revenue Card */}
      <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.revenueLabel}>Revenue This Month</Text>
        <Text style={styles.revenueValue}>{data ? fmt(data.total_revenue_this_month) : "—"}</Text>
        <Text style={styles.revenueSub}>from accepted quotations</Text>
      </View>

      {/* KPIs */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>My Activity</Text>
      <View style={styles.kpiGrid}>
        {kpis.map((k) => (
          <View key={k.label} style={[styles.kpiCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <MaterialCommunityIcons name={k.icon as any} size={22} color={k.color} style={styles.kpiIcon} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{k.value}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <TouchableOpacity
        style={[styles.actionRow, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
        onPress={() => navigation.navigate("RFQs Inbox")}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.primary + "18" }]}>
          <MaterialCommunityIcons name="email-open-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>View RFQ Invitations</Text>
          <Text style={[styles.actionSub, { color: colors.textMuted }]}>Submit your quotations</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionRow, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
        onPress={() => navigation.navigate("Orders")}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.secondary + "18" }]}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.secondary} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Track Purchase Orders</Text>
          <Text style={[styles.actionSub, { color: colors.textMuted }]}>Monitor delivery & payments</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  orgName: { fontSize: 13, fontWeight: "600" },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  revenueCard: {
    borderRadius: 16, padding: 20, marginBottom: 24,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  revenueLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" },
  revenueValue: { color: "#fff", fontSize: 36, fontWeight: "900", marginVertical: 4 },
  revenueSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  kpiCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  kpiIcon: { marginBottom: 8 },
  kpiValue: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  kpiLabel: { fontSize: 12, fontWeight: "500" },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  actionMeta: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: "700" },
  actionSub: { fontSize: 12, marginTop: 2 },
});
