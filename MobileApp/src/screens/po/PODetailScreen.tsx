import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { poService } from "../../services/poService";
import { LoadingButton } from "../../components/common/LoadingButton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { PurchaseOrder } from "../../services/mocks/mockData";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_STEPS: PurchaseOrder["status"][] = ["generated", "acknowledged", "in_transit", "delivered"];

export const PODetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { poId } = route.params;
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState<PurchaseOrder["status"] | null>(null);

  const { data: po, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["po", poId],
    queryFn: () => poService.getPODetail(poId),
  });

  const mutation = useMutation({
    mutationFn: (status: PurchaseOrder["status"]) => poService.updateStatus(poId, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["po", poId] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      const isDelivered = status === "delivered";
      Toast.show({
        type: "success",
        text1: isDelivered ? "Marked as Delivered!" : "Status Updated",
        text2: isDelivered ? "Invoice has been auto-generated." : `PO is now: ${status}`,
      });
    },
    onError: () => Alert.alert("Error", "Failed to update PO status"),
  });

  if (isLoading || !po) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading PO...</Text>
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(po.status as any);
  const isVendor = user?.role === "vendor";
  const nextStatuses: { label: string; status: PurchaseOrder["status"] }[] = [];
  if (isVendor && po.status === "generated") nextStatuses.push({ label: "Acknowledge Receipt", status: "acknowledged" });
  if (isVendor && po.status === "acknowledged") nextStatuses.push({ label: "Mark In Transit", status: "in_transit" });
  if (po.status === "in_transit") nextStatuses.push({ label: "Mark as Delivered", status: "delivered" });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* PO Header */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.poNum, { color: colors.primary }]}>{po.po_number}</Text>
        <Text style={[styles.vendorName, { color: colors.text }]}>{po.vendor_name}</Text>
        <Text style={[styles.amount, { color: colors.text }]}>{fmt(po.total_amount)}</Text>
      </View>

      {/* Progress Tracker */}
      <View style={[styles.tracker, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.trackerTitle, { color: colors.text }]}>Delivery Status</Text>
        <View style={styles.steps}>
          {STATUS_STEPS.map((s, i) => {
            const done = i <= currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <View key={s} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: done ? colors.success : colors.surfaceBorder }]}>
                  {done
                    ? <MaterialCommunityIcons name="check" size={13} color="#fff" />
                    : <View style={[styles.stepInner, { backgroundColor: active ? colors.primary : colors.surfaceBorder }]} />
                  }
                </View>
                <Text style={[styles.stepLabel, { color: done ? colors.text : colors.textMuted }]}>
                  {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                {i < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: done ? colors.success : colors.surfaceBorder }]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Details Card */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Details</Text>
        {[
          { l: "Delivery Address", v: po.delivery_address },
          { l: "Expected Delivery", v: format(new Date(po.expected_delivery_date), "dd MMM yyyy") },
          { l: "Payment Terms", v: po.payment_terms },
          ...(po.special_instructions ? [{ l: "Instructions", v: po.special_instructions }] : []),
          ...(po.remarks ? [{ l: "Remarks", v: po.remarks }] : []),
        ].map(({ l, v }) => (
          <View key={l} style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{l}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Status Actions */}
      {nextStatuses.map(({ label, status }) => (
        <LoadingButton
          key={status}
          label={label}
          isLoading={mutation.isPending}
          onPress={() => setConfirmStatus(status)}
          buttonStyle={[styles.actionBtn, status === "delivered" && { backgroundColor: colors.success }]}
        />
      ))}

      <ConfirmDialog
        visible={confirmStatus !== null}
        title="Update PO Status"
        description={`Mark this PO as "${confirmStatus?.replace("_", " ")}"? ${confirmStatus === "delivered" ? "An invoice will be auto-generated." : ""}`}
        confirmLabel="Confirm"
        onConfirm={() => { mutation.mutate(confirmStatus!); setConfirmStatus(null); }}
        onCancel={() => setConfirmStatus(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  poNum: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  vendorName: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  amount: { fontSize: 28, fontWeight: "900" },
  tracker: { borderRadius: 14, borderWidth: 1, padding: 16 },
  trackerTitle: { fontSize: 14, fontWeight: "700", marginBottom: 14 },
  steps: { gap: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  stepInner: { width: 10, height: 10, borderRadius: 5 },
  stepLabel: { fontSize: 13, fontWeight: "600", flex: 1 },
  stepLine: { width: 2, height: 20, position: "absolute", left: 13, top: 28 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", flex: 1.5, textAlign: "right" },
  actionBtn: { height: 50 },
});
