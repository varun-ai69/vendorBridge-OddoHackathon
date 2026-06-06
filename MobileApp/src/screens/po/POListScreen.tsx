import React from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useTheme } from "../../theme/ThemeContext";
import { poService } from "../../services/poService";
import { PurchaseOrder } from "../../services/mocks/mockData";
import { SkeletonListScreen } from "../../components/common/SkeletonLoader";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_META: Record<string, { color: string; label: string; icon: string }> = {
  generated:    { color: "#0ea5e9", label: "Generated",    icon: "file-document-outline" },
  acknowledged: { color: "#8b5cf6", label: "Acknowledged", icon: "check" },
  in_transit:   { color: "#f59e0b", label: "In Transit",   icon: "truck-outline" },
  delivered:    { color: "#10b981", label: "Delivered",    icon: "package-variant" },
  cancelled:    { color: "#ef4444", label: "Cancelled",    icon: "cancel" },
};

export const POListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["pos"],
    queryFn: poService.getPOs,
  });

  if (isLoading && data.length === 0) {
    return <SkeletonListScreen count={4} />;
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={data}
      keyExtractor={(p: PurchaseOrder) => p.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      renderItem={({ item: po }: { item: PurchaseOrder }) => {
        const meta = STATUS_META[po.status];
        return (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
            onPress={() => navigation.navigate("PODetail", { poId: po.id })}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.poNum, { color: colors.primary }]}>{po.po_number}</Text>
                <Text style={[styles.vendorName, { color: colors.text }]}>{po.vendor_name}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: meta.color + "20" }]}>
                <MaterialCommunityIcons name={meta.icon as any} size={12} color={meta.color} />
                <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="currency-inr" size={14} color={colors.textMuted} />
                <Text style={[styles.footerText, { color: colors.text }]}>{fmt(po.total_amount)}</Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Due: {format(new Date(po.expected_delivery_date), "dd MMM yyyy")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialCommunityIcons name="receipt-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No purchase orders yet
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14 },
  poNum: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  vendorName: { fontSize: 15, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1 },
  cardFooter: { flexDirection: "row", gap: 16, padding: 12 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText: { fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
