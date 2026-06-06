import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useTheme } from "../../theme/ThemeContext";
import { poService } from "../../services/poService";
import { Invoice } from "../../services/mocks/mockData";
import { SkeletonListScreen } from "../../components/common/SkeletonLoader";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_META: Record<string, { color: string; label: string }> = {
  pending: { color: "#f59e0b", label: "Pending" },
  paid:    { color: "#10b981", label: "Paid" },
  overdue: { color: "#ef4444", label: "Overdue" },
  disputed:{ color: "#8b5cf6", label: "Disputed" },
};

export const InvoiceListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["invoices"],
    queryFn: poService.getInvoices,
  });

  if (isLoading && data.length === 0) {
    return <SkeletonListScreen count={4} />;
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={data}
      keyExtractor={(inv: Invoice) => inv.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      renderItem={({ item: inv }: { item: Invoice }) => {
        const meta = STATUS_META[inv.status];
        return (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
            onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: inv.id })}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.invNum, { color: colors.primary }]}>{inv.invoice_number}</Text>
                <Text style={[styles.vendorName, { color: colors.text }]}>{inv.vendor_name}</Text>
                <Text style={[styles.poRef, { color: colors.textMuted }]}>PO: {inv.po_number}</Text>
              </View>
              <View style={styles.rightCol}>
                <View style={[styles.badge, { backgroundColor: meta.color + "20" }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.amount, { color: colors.text }]}>{fmt(inv.grand_total)}</Text>
              </View>
            </View>
            <View style={[styles.dateRow, { borderTopColor: colors.surfaceBorder }]}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                Due: {format(new Date(inv.due_date), "dd MMM yyyy")}
              </Text>
              {inv.payment_date && (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={13} color={colors.success} />
                  <Text style={[styles.dateText, { color: colors.success }]}>
                    Paid: {format(new Date(inv.payment_date), "dd MMM yyyy")}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialCommunityIcons name="receipt-text-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No invoices yet. Invoices appear after POs are delivered.
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", padding: 14 },
  invNum: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  vendorName: { fontSize: 15, fontWeight: "700" },
  poRef: { fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: "flex-end", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  amount: { fontSize: 16, fontWeight: "800" },
  dateRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
  },
  dateText: { fontSize: 12, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 24 },
  emptyText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
});
