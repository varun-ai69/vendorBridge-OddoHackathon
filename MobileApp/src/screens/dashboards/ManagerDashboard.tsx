import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboardService";

const fmt = (n: number) =>
  `₹${n >= 1_00_000 ? (n / 1_00_000).toFixed(1) + "L" : n.toLocaleString("en-IN")}`;

export const ManagerDashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["dashboard", "manager"],
    queryFn: () => dashboardService.getDashboard("manager"),
  });

  const trend = data?.approval_trend ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Good day 👋</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.role, { color: colors.accent }]}>Finance Manager</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent + "22" }]}>
          <MaterialCommunityIcons name="check-decagram-outline" size={28} color={colors.accent} />
        </View>
      </View>

      {/* Action Required Banner */}
      {(data?.pending_approvals ?? 0) > 0 && (
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.warning + "18", borderColor: colors.warning }]}
          onPress={() => navigation.navigate("Approvals", { screen: "ApprovalsList" })}
        >
          <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.warning} />
          <Text style={[styles.bannerText, { color: colors.warning }]}>
            {data?.pending_approvals} approval{data?.pending_approvals > 1 ? "s" : ""} awaiting your action
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>This Month</Text>
      <View style={styles.statsRow}>
        <View style={[styles.bigStat, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.success} />
          <Text style={[styles.bigStatValue, { color: colors.success }]}>{data?.approved_this_month ?? "—"}</Text>
          <Text style={[styles.bigStatLabel, { color: colors.textMuted }]}>Approved</Text>
        </View>
        <View style={[styles.bigStat, { backgroundColor: colors.danger + "15", borderColor: colors.danger }]}>
          <MaterialCommunityIcons name="close-circle-outline" size={28} color={colors.danger} />
          <Text style={[styles.bigStatValue, { color: colors.danger }]}>{data?.rejected_this_month ?? "—"}</Text>
          <Text style={[styles.bigStatLabel, { color: colors.textMuted }]}>Rejected</Text>
        </View>
      </View>
      <View style={[styles.spendCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.spendLabel, { color: colors.textMuted }]}>Total Spend Approved</Text>
        <Text style={[styles.spendValue, { color: colors.primary }]}>{data ? fmt(data.total_spend_approved) : "—"}</Text>
      </View>

      {/* Approval Trend Table */}
      {trend.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Approval Trend (6 Months)</Text>
          <View style={[styles.trendTable, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.trendHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.trendCol, { color: colors.textMuted }]}>Month</Text>
              <Text style={[styles.trendColRight, { color: colors.success }]}>✓ Approved</Text>
              <Text style={[styles.trendColRight, { color: colors.danger }]}>✗ Rejected</Text>
            </View>
            {trend.map((row: any) => (
              <View key={row.month} style={[styles.trendRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.trendCol, { color: colors.text }]}>{row.month}</Text>
                <Text style={[styles.trendColRight, { color: colors.success }]}>{row.approved}</Text>
                <Text style={[styles.trendColRight, { color: colors.danger }]}>{row.rejected}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  role: { fontSize: 13, fontWeight: "600" },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  bannerText: { flex: 1, fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bigStat: {
    flex: 1, alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  bigStatValue: { fontSize: 28, fontWeight: "900" },
  bigStatLabel: { fontSize: 12, fontWeight: "600" },
  spendCard: {
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20,
    alignItems: "center",
  },
  spendLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  spendValue: { fontSize: 28, fontWeight: "900" },
  trendTable: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  trendHeader: { flexDirection: "row", padding: 12, borderBottomWidth: 1 },
  trendRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  trendCol: { flex: 1, fontSize: 13, fontWeight: "600" },
  trendColRight: { width: 90, textAlign: "right", fontSize: 13, fontWeight: "700" },
});
