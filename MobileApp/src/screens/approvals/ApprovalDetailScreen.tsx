import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { approvalService } from "../../services/approvalService";
import { LoadingButton } from "../../components/common/LoadingButton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const ApprovalDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { approvalId } = route.params;
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approved" | "rejected" | null>(null);

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: approvalService.getApprovals,
  });
  const approval = approvals.find((a: any) => a.approval_id === approvalId);

  const mutation = useMutation({
    mutationFn: ({ action, remarks }: { action: "approved" | "rejected"; remarks: string }) =>
      approvalService.approveOrReject(approvalId, action, remarks),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      Toast.show({
        type: vars.action === "approved" ? "success" : "error",
        text1: vars.action === "approved" ? "Approved! PO Generated." : "Rejected.",
        text2: vars.action === "approved" ? "Purchase Order has been created." : "RFQ re-opened for new bids.",
      });
      navigation.goBack();
    },
    onError: () => Alert.alert("Error", "Action failed. Please try again."),
  });

  if (isLoading || !approval) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading approval...</Text>
      </View>
    );
  }

  const isPending = approval.status === "pending";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>

        {/* Status Header */}
        <View style={[
          styles.statusHeader,
          {
            backgroundColor:
              approval.status === "approved" ? colors.success + "14" :
              approval.status === "rejected" ? colors.danger + "14" : colors.warning + "14",
            borderColor:
              approval.status === "approved" ? colors.success :
              approval.status === "rejected" ? colors.danger : colors.warning,
          }
        ]}>
          <MaterialCommunityIcons
            name={approval.status === "approved" ? "check-circle-outline" : approval.status === "rejected" ? "close-circle-outline" : "clock-outline"}
            size={24}
            color={approval.status === "approved" ? colors.success : approval.status === "rejected" ? colors.danger : colors.warning}
          />
          <Text style={[
            styles.statusTitle,
            { color: approval.status === "approved" ? colors.success : approval.status === "rejected" ? colors.danger : colors.warning }
          ]}>
            {approval.status === "pending" ? "Awaiting Your Decision" :
             approval.status === "approved" ? "Approved — PO Generated" : "Rejected — RFQ Re-Opened"}
          </Text>
        </View>

        {/* RFQ Summary */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Procurement Request</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>RFQ Number</Text>
            <Text style={[styles.value, { color: colors.primary }]}>{approval.rfq_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Description</Text>
            <Text style={[styles.value, { color: colors.text }]}>{approval.rfq_title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Requested By</Text>
            <Text style={[styles.value, { color: colors.text }]}>{approval.requested_by}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Requested On</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {format(new Date(approval.requested_at), "dd MMM yyyy, h:mm a")}
            </Text>
          </View>
        </View>

        {/* Selected Quote */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Shortlisted Quotation</Text>

          <View style={[styles.vendorBlock, { backgroundColor: colors.primary + "10" }]}>
            <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.primary} />
            <Text style={[styles.vendorName, { color: colors.primary }]}>{approval.selected_vendor}</Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Quotation Value</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>{fmt(approval.quotation_amount)}</Text>
          </View>
        </View>

        {/* Remarks History */}
        {approval.remarks && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Remarks</Text>
            <Text style={[styles.remarksText, { color: colors.textMuted }]}>{approval.remarks}</Text>
          </View>
        )}

        {/* Action Section (only if pending) */}
        {isPending && (
          <View style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Remarks</Text>
            <TextInput
              style={[styles.remarksInput, { borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Add remarks (optional)..."
              placeholderTextColor={colors.textMuted}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionBtns}>
              <LoadingButton
                label="Approve & Generate PO"
                isLoading={mutation.isPending}
                onPress={() => setConfirmAction("approved")}
                buttonStyle={[styles.btn, { backgroundColor: colors.success }]}
              />
              <LoadingButton
                label="Reject"
                isLoading={mutation.isPending}
                variant="outline"
                onPress={() => setConfirmAction("rejected")}
                buttonStyle={[styles.btn, { borderColor: colors.danger }]}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmAction !== null}
        title={confirmAction === "approved" ? "Approve & Generate PO?" : "Reject This Request?"}
        description={
          confirmAction === "approved"
            ? `This will approve ₹${approval.quotation_amount.toLocaleString("en-IN")} and generate a Purchase Order for ${approval.selected_vendor}.`
            : "The RFQ will be re-opened. Vendors may need to resubmit bids."
        }
        confirmLabel={confirmAction === "approved" ? "Approve" : "Reject"}
        confirmColor={confirmAction === "approved" ? colors.success : colors.danger}
        onConfirm={() => {
          mutation.mutate({ action: confirmAction!, remarks });
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15 },
  statusHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  statusTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  actionCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: 13, flex: 1 },
  value: { fontSize: 13, fontWeight: "600", textAlign: "right", flex: 1.5 },
  vendorBlock: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  vendorName: { fontSize: 16, fontWeight: "800" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountLabel: { fontSize: 13 },
  amountValue: { fontSize: 22, fontWeight: "900" },
  remarksText: { fontSize: 14, lineHeight: 20 },
  remarksInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
    height: 80, textAlignVertical: "top",
  },
  actionBtns: { gap: 10 },
  btn: { height: 50 },
});
