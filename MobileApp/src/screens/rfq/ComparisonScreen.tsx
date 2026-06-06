import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { rfqService } from "../../services/rfqService";
import { mockService } from "../../services/mocks/mockService";
import { Quotation } from "../../services/mocks/mockData";
import { LoadingButton } from "../../components/common/LoadingButton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const ComparisonScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { rfqId } = route.params;
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiRec, setAiRec] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["quotations", rfqId],
    queryFn: () => rfqService.getQuotationsForRFQ(rfqId),
  });

  const mutation = useMutation({
    mutationFn: () => rfqService.shortlistQuotation(rfqId, selectedQuote!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
      Toast.show({ type: "success", text1: "Shortlisted!", text2: "Approval request sent to manager." });
      navigation.goBack();
    },
    onError: () => Alert.alert("Error", "Failed to shortlist quotation."),
  });

  const getAiRecommendation = async () => {
    setAiLoading(true);
    try {
      const result = await mockService.getAiRecommendation(rfqId);
      setAiRec(result.recommendation);
    } catch {
      Alert.alert("Error", "AI recommendation unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading quotations...</Text>
      </View>
    );
  }

  // Find min price for green highlighting
  const minPrice = quotations.length > 0 ? Math.min(...quotations.map((q) => q.total_amount)) : null;
  const minDelivery = quotations.length > 0 ? Math.min(...quotations.map((q) => q.delivery_timeline_days)) : null;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* AI Banner */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: colors.primary + "14", borderColor: colors.primary }]}
          onPress={getAiRecommendation}
          disabled={aiLoading}
        >
          <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
          <Text style={[styles.aiBannerText, { color: colors.primary }]}>
            {aiLoading ? "Analysing bids with AI..." : "Get AI Recommendation (Groq)"}
          </Text>
        </TouchableOpacity>

        {/* AI Result */}
        {aiRec && (
          <View style={[styles.aiResult, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
            <Text style={[styles.aiResultText, { color: colors.text }]}>{aiRec}</Text>
          </View>
        )}

        {/* Comparison Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Column Headers */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.headerLabel, { color: colors.textMuted }]}>Criteria</Text>
              </View>
              {quotations.map((q) => (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.dataCol,
                    { backgroundColor: selectedQuote === q.id ? colors.primary + "18" : colors.cardBg },
                    { borderColor: selectedQuote === q.id ? colors.primary : colors.surfaceBorder },
                  ]}
                  onPress={() => setSelectedQuote(q.id)}
                >
                  <Text style={[styles.vendorColTitle, { color: colors.text }]} numberOfLines={2}>{q.vendor_name}</Text>
                  <Text style={[styles.quoteNum, { color: colors.textMuted }]}>{q.quotation_number}</Text>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={13} color={colors.accent} />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{q.vendor_rating.toFixed(1)}</Text>
                  </View>
                  {selectedQuote === q.id && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Total Price Row */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Total Price</Text>
              </View>
              {quotations.map((q) => (
                <View
                  key={q.id}
                  style={[
                    styles.dataCell,
                    { backgroundColor: q.total_amount === minPrice ? colors.success + "18" : colors.cardBg },
                    { borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.cellValue, { color: q.total_amount === minPrice ? colors.success : colors.text }]}>
                    {fmt(q.total_amount)}
                  </Text>
                  {q.total_amount === minPrice && (
                    <MaterialCommunityIcons name="arrow-down-circle" size={14} color={colors.success} />
                  )}
                </View>
              ))}
            </View>

            {/* Delivery Timeline */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Delivery (days)</Text>
              </View>
              {quotations.map((q) => (
                <View
                  key={q.id}
                  style={[
                    styles.dataCell,
                    { backgroundColor: q.delivery_timeline_days === minDelivery ? colors.info + "18" : colors.cardBg },
                    { borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.cellValue, { color: q.delivery_timeline_days === minDelivery ? colors.info : colors.text }]}>
                    {q.delivery_timeline_days}d
                  </Text>
                </View>
              ))}
            </View>

            {/* Payment Terms */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Payment Terms</Text>
              </View>
              {quotations.map((q) => (
                <View key={q.id} style={[styles.dataCell, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.cellValue, { color: colors.text }]}>{q.payment_terms}</Text>
                </View>
              ))}
            </View>

            {/* Validity */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Validity</Text>
              </View>
              {quotations.map((q) => (
                <View key={q.id} style={[styles.dataCell, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.cellValue, { color: colors.text }]}>{q.validity_days} days</Text>
                </View>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCol, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Notes</Text>
              </View>
              {quotations.map((q) => (
                <View key={q.id} style={[styles.dataCellNotes, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>{q.notes ?? "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
        <LoadingButton
          label={selectedQuote ? "Shortlist & Request Approval" : "Select a quotation above"}
          isLoading={mutation.isPending}
          onPress={selectedQuote ? () => setConfirmOpen(true) : undefined}
          buttonStyle={[styles.shortlistBtn, !selectedQuote && { opacity: 0.5 }]}
        />
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        title="Shortlist Quotation?"
        description="This will close the RFQ and send an approval request to the Manager."
        confirmLabel="Shortlist"
        onConfirm={() => { setConfirmOpen(false); mutation.mutate(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 15 },
  content: { padding: 16, paddingBottom: 16 },
  aiBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  aiBannerText: { fontSize: 14, fontWeight: "700" },
  aiResult: {
    borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  aiResultText: { fontSize: 12, lineHeight: 18 },
  tableRow: { flexDirection: "row" },
  labelCol: {
    width: 120, justifyContent: "center", padding: 10,
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)",
  },
  headerLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  rowLabel: { fontSize: 12, fontWeight: "600" },
  dataCol: {
    width: 150, padding: 10, borderWidth: 1, alignItems: "center",
  },
  dataCell: {
    width: 150, padding: 10, borderWidth: 0.5, alignItems: "center", flexDirection: "row",
    justifyContent: "center", gap: 4,
  },
  dataCellNotes: {
    width: 150, padding: 10, borderWidth: 0.5,
  },
  vendorColTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  quoteNum: { fontSize: 10, textAlign: "center", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: "700" },
  selectedBadge: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  selectedBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cellValue: { fontSize: 13, fontWeight: "700" },
  notesText: { fontSize: 11, lineHeight: 16 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  shortlistBtn: { height: 50 },
});
