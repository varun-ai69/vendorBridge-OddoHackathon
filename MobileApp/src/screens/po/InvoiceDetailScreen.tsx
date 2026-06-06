import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { poService } from "../../services/poService";
import { LoadingButton } from "../../components/common/LoadingButton";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const InvoiceDetailScreen = ({ route }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { invoiceId } = route.params;
  const queryClient = useQueryClient();
  const [reference, setReference] = useState("");

  const { data: invoices = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["invoices"],
    queryFn: poService.getInvoices,
  });
  const invoice = invoices.find((i: any) => i.id === invoiceId);

  const mutation = useMutation({
    mutationFn: () => poService.markInvoicePaid(invoiceId, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      Toast.show({ type: "success", text1: "Invoice Marked Paid!", text2: `Ref: ${reference}` });
    },
    onError: () => Alert.alert("Error", "Failed to mark as paid"),
  });

  if (isLoading || !invoice) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading invoice...</Text>
      </View>
    );
  }

  const statusColor =
    invoice.status === "paid" ? colors.success :
    invoice.status === "overdue" ? colors.danger :
    invoice.status === "disputed" ? colors.warning : colors.accent;

  const isPO = user?.role === "procurement_officer";
  const canPay = isPO && invoice.status === "pending";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor + "14", borderColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          Invoice {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Text>
      </View>

      {/* Invoice Header */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <View style={styles.invHeader}>
          <View>
            <Text style={[styles.invNum, { color: colors.primary }]}>{invoice.invoice_number}</Text>
            <Text style={[styles.vendorName, { color: colors.text }]}>{invoice.vendor_name}</Text>
          </View>
          <Text style={[styles.total, { color: colors.text }]}>{fmt(invoice.grand_total)}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {[
          { l: "PO Reference", v: invoice.po_number },
          { l: "Invoice Date", v: format(new Date(invoice.invoice_date), "dd MMM yyyy") },
          { l: "Due Date", v: format(new Date(invoice.due_date), "dd MMM yyyy") },
          { l: "Subtotal", v: fmt(invoice.subtotal) },
          { l: "GST", v: fmt(invoice.tax_total) },
          { l: "Grand Total", v: fmt(invoice.grand_total) },
        ].map(({ l, v }) => (
          <View key={l} style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{l}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Bank Details */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bank Details</Text>
        {[
          { l: "Bank", v: invoice.bank_name },
          { l: "Account", v: invoice.bank_account },
          { l: "IFSC", v: invoice.bank_ifsc },
        ].map(({ l, v }) => (
          <View key={l} style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{l}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Payment Info (if paid) */}
      {invoice.status === "paid" && (
        <View style={[styles.card, { backgroundColor: colors.success + "10", borderColor: colors.success }]}>
          <View style={styles.paidRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.paidTitle, { color: colors.success }]}>Payment Received</Text>
          </View>
          <Text style={[styles.paidRef, { color: colors.textMuted }]}>
            Ref: {invoice.payment_reference} · {invoice.payment_date && format(new Date(invoice.payment_date), "dd MMM yyyy")}
          </Text>
        </View>
      )}

      {/* Mark Paid Action */}
      {canPay && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mark as Paid</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Payment reference / UTR number"
            placeholderTextColor={colors.textMuted}
            value={reference}
            onChangeText={setReference}
          />
          <LoadingButton
            label="Confirm Payment"
            isLoading={mutation.isPending}
            onPress={reference.trim() ? () => mutation.mutate() : undefined}
            buttonStyle={[styles.payBtn, !reference.trim() && { opacity: 0.5 }, { backgroundColor: colors.success }]}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  invNum: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  vendorName: { fontSize: 18, fontWeight: "800" },
  total: { fontSize: 22, fontWeight: "900" },
  divider: { height: 1, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", textAlign: "right", flex: 1.5 },
  paidRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  paidTitle: { fontSize: 15, fontWeight: "700" },
  paidRef: { fontSize: 13 },
  input: {
    borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15, marginBottom: 12,
  },
  payBtn: { height: 48 },
});
