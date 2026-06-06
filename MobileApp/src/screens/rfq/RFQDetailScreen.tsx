import React from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { rfqService } from "../../services/rfqService";
import { LoadingButton } from "../../components/common/LoadingButton";

const STATUS_META: Record<string, { color: string; label: string }> = {
  draft:     { color: "#94a3b8", label: "Draft" },
  sent:      { color: "#0ea5e9", label: "Open — Collecting Bids" },
  closed:    { color: "#8b5cf6", label: "Closed — Pending Approval" },
  awarded:   { color: "#10b981", label: "Awarded" },
  cancelled: { color: "#ef4444", label: "Cancelled" },
};

export const RFQDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { rfqId } = route.params;

  const { data: rfq, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rfq", rfqId],
    queryFn: () => rfqService.getRFQDetail(rfqId),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations", rfqId],
    queryFn: () => rfqService.getQuotationsForRFQ(rfqId),
    enabled: !!rfq && rfq.status !== "draft",
  });

  if (isLoading || !rfq) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="loading" size={32} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading RFQ...</Text>
      </View>
    );
  }

  const meta = STATUS_META[rfq.status] ?? STATUS_META.draft;
  const isPO = user?.role === "procurement_officer";
  const isVendor = user?.role === "vendor";
  const canCompare = isPO && rfq.status === "sent" && quotations.length >= 2;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: meta.color + "18", borderColor: meta.color }]}>
        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
      </View>

      {/* Header */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.rfqNumber, { color: colors.primary }]}>{rfq.rfq_number}</Text>
        <Text style={[styles.rfqTitle, { color: colors.text }]}>{rfq.title}</Text>
        <Text style={[styles.rfqDesc, { color: colors.textMuted }]}>{rfq.description}</Text>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-clock" size={15} color={colors.textMuted} />
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Deadline</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {format(new Date(rfq.deadline), "dd MMM yyyy, h:mm a")}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.textMuted} />
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Delivery Location</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{rfq.delivery_location}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-outline" size={15} color={colors.textMuted} />
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Created By</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{rfq.created_by}</Text>
            </View>
          </View>
        </View>
        {rfq.notes && (
          <View style={[styles.notesBox, { backgroundColor: colors.accent + "14", borderColor: colors.accent }]}>
            <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.accent} />
            <Text style={[styles.notesText, { color: colors.text }]}>{rfq.notes}</Text>
          </View>
        )}
      </View>

      {/* Line Items */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Line Items ({rfq.items.length})</Text>
      {rfq.items.map((item, idx) => (
        <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.itemIndex, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.itemIndexText, { color: colors.primary }]}>{idx + 1}</Text>
          </View>
          <View style={styles.itemBody}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
            <Text style={[styles.itemSpec, { color: colors.textMuted }]}>{item.description}</Text>
            <View style={styles.itemMeta}>
              <Text style={[styles.itemQty, { color: colors.primary }]}>
                {item.quantity} {item.unit}
              </Text>
              {item.specifications && (
                <Text style={[styles.itemSpecTag, { color: colors.textMuted }]}>{item.specifications}</Text>
              )}
            </View>
          </View>
        </View>
      ))}

      {/* Quotations Count */}
      {!isVendor && rfq.status !== "draft" && (
        <View style={[styles.quoteCountBanner, { backgroundColor: colors.secondary + "14", borderColor: colors.secondary }]}>
          <MaterialCommunityIcons name="email-open-outline" size={18} color={colors.secondary} />
          <Text style={[styles.quoteCountText, { color: colors.secondary }]}>
            {quotations.length} quotation{quotations.length !== 1 ? "s" : ""} received
          </Text>
        </View>
      )}

      {/* Actions */}
      {canCompare && (
        <LoadingButton
          label="Compare Quotations"
          onPress={() => navigation.navigate("Comparison", { rfqId })}
          buttonStyle={[styles.actionBtn, { backgroundColor: colors.primary }]}
        />
      )}

      {isVendor && rfq.status === "sent" && (
        <LoadingButton
          label="Submit Quotation"
          onPress={() => navigation.navigate("QuoteSubmit", { rfqId })}
          buttonStyle={[styles.actionBtn, { backgroundColor: colors.secondary }]}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  rfqNumber: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  rfqTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  rfqDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  metaGrid: { gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  metaLabel: { fontSize: 11, fontWeight: "500" },
  metaValue: { fontSize: 13, fontWeight: "600", marginTop: 1 },
  notesBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, padding: 10, borderRadius: 8, borderWidth: 1,
  },
  notesText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  itemCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  itemIndex: {
    width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center",
  },
  itemIndexText: { fontSize: 13, fontWeight: "800" },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  itemSpec: { fontSize: 12, marginBottom: 6 },
  itemMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemQty: { fontSize: 13, fontWeight: "700" },
  itemSpecTag: { fontSize: 11 },
  quoteCountBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginVertical: 12,
  },
  quoteCountText: { fontSize: 14, fontWeight: "600" },
  actionBtn: { height: 50, marginTop: 8, marginBottom: 8 },
});
