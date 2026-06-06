import React from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboardService";

const fmt = (n: number) =>
  `₹${n >= 1_00_000 ? (n / 1_00_000).toFixed(1) + "L" : n.toLocaleString("en-IN")}`;

const StatCard = ({
  icon, label, value, color, sub,
}: {
  icon: string; label: string; value: string | number; color: string; sub?: string;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: color }]}>{sub}</Text>}
    </View>
  );
};

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => dashboardService.getDashboard("admin"),
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back 👋</Text>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.orgBadge, { color: colors.primary }]}>{user?.org_name} — Admin</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="shield-crown" size={28} color={colors.primary} />
        </View>
      </View>

      {/* KPI Cards */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>This Month</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="currency-inr" label="Total Spend" value={data ? fmt(data.total_spend_this_month) : "—"} color={colors.primary} />
        <StatCard icon="file-document-multiple" label="Purchase Orders" value={data?.total_pos_this_month ?? "—"} color={colors.secondary} />
        <StatCard icon="account-group" label="Users" value={data?.total_users ?? "—"} color={colors.accent} />
        <StatCard icon="storefront" label="Vendors" value={data?.total_vendors ?? "—"} color={colors.info} />
        <StatCard icon="clock-alert-outline" label="Pending Approvals" value={data?.pending_approvals ?? "—"} color={colors.warning} />
        <StatCard icon="receipt-text-outline" label="Pending Invoices" value={data?.total_invoices_pending ?? "—"} color={colors.danger} />
      </View>

      {/* Spend by Category */}
      {data?.spend_by_category && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spend by Category</Text>
          {data.spend_by_category.map((item: any) => (
            <View key={item.category} style={[styles.categoryRow, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{item.category}</Text>
              <Text style={[styles.categoryAmt, { color: colors.primary }]}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </>
      )}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
          onPress={() => navigation.navigate("Vendors", { screen: "VendorCreate" })}
        >
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Invite Vendor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary }]}
          onPress={() => navigation.navigate("Audit Trail")}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.secondary }]}>Audit Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  orgBadge: { fontSize: 13, fontWeight: "600" },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: {
    width: "47%", borderRadius: 12, borderWidth: 1, padding: 14,
    alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  statSub: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  categoryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  categoryName: { fontSize: 14, fontWeight: "600" },
  categoryAmt: { fontSize: 15, fontWeight: "800" },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 10, borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: "700" },
});
