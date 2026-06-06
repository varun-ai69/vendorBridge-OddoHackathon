import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useTheme } from "../../theme/ThemeContext";
import { approvalService } from "../../services/approvalService";
import { Approval } from "../../services/mocks/mockData";
import { SkeletonListScreen } from "../../components/common/SkeletonLoader";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const ApprovalCard = ({ approval, onPress }: { approval: Approval; onPress: () => void }) => {
  const { colors } = useTheme();
  const statusColor =
    approval.status === "approved" ? colors.success :
    approval.status === "rejected" ? colors.danger : colors.warning;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Review approval ${approval.rfq_number}`}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.rfqRef, { color: colors.primary }]}>{approval.rfq_number}</Text>
          <Text style={[styles.rfqTitle, { color: colors.text }]}>{approval.rfq_title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {approval.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="storefront-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.text }]}>{approval.selected_vendor}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="currency-inr" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.text }]}>{fmt(approval.quotation_amount)}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {format(new Date(approval.requested_at), "dd MMM yyyy")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ApprovalsListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["approvals"],
    queryFn: approvalService.getApprovals,
  });

  const filtered = data.filter((a: Approval) => filter === "all" || a.status === filter);
  const pendingCount = data.filter((a: Approval) => a.status === "pending").length;

  if (isLoading && data.length === 0) {
    return <SkeletonListScreen count={4} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, { color: filter === f ? colors.primary : colors.textMuted }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.approval_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <ApprovalCard
            approval={item}
            onPress={() => navigation.navigate("ApprovalDetail", { approvalId: item.approval_id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {`No ${filter} approvals`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14 },
  rfqRef: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  rfqTitle: { fontSize: 15, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "800" },
  divider: { height: 1 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
