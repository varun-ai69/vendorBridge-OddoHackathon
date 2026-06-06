import React, { useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Share, TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { poService } from "../../services/poService";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const POQRScreen = ({ route }: any) => {
  const { colors } = useTheme();
  const { poId } = route.params;

  const { data: po, isLoading } = useQuery({
    queryKey: ["po", poId],
    queryFn: () => poService.getPODetail(poId),
  });

  const qrSvgRef = useRef<any>(null);

  const qrPayload = po
    ? JSON.stringify({
        po_number: po.po_number,
        vendor: po.vendor_name,
        total: po.total_amount,
        expected_delivery: po.expected_delivery_date,
        status: po.status,
      })
    : "";

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        title: `VendorBridge PO: ${po?.po_number}`,
        message:
          `Purchase Order: ${po?.po_number}\n` +
          `Vendor: ${po?.vendor_name}\n` +
          `Amount: ${fmt(po?.total_amount ?? 0)}\n` +
          `Status: ${po?.status}\n` +
          `Expected Delivery: ${po?.expected_delivery_date ? format(new Date(po.expected_delivery_date), "dd MMM yyyy") : "—"}`,
      });
    } catch {
      Toast.show({ type: "error", text1: "Could not share PO" });
    }
  };

  if (isLoading || !po) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading PO...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* QR Card */}
      <View style={[styles.qrCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.qrTitle, { color: colors.text }]}>Scan to Verify PO</Text>
        <Text style={[styles.qrSub, { color: colors.textMuted }]}>
          Use VendorBridge scanner or any QR reader to verify authenticity.
        </Text>

        <View style={[styles.qrBox, { backgroundColor: "#fff", borderColor: colors.surfaceBorder }]}>
          <QRCode
            value={qrPayload}
            size={200}
            color={colors.primary}
            backgroundColor="#fff"
            getRef={(ref) => { qrSvgRef.current = ref; }}
          />
        </View>

        <Text style={[styles.poNumber, { color: colors.primary }]}>{po.po_number}</Text>
      </View>

      {/* PO Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>PO Summary</Text>

        {[
          { l: "Vendor", v: po.vendor_name },
          { l: "Grand Total", v: fmt(po.total_amount) },
          { l: "Status", v: po.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
          { l: "Expected Delivery", v: format(new Date(po.expected_delivery_date), "dd MMM yyyy") },
          { l: "Payment Terms", v: po.payment_terms },
          { l: "Delivery Address", v: po.delivery_address },
        ].map(({ l, v }) => (
          <View key={l} style={[styles.summaryRow, { borderBottomColor: colors.surfaceBorder }]}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{l}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Share Action */}
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Share PO details"
      >
        <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
        <Text style={styles.shareBtnText}>Share PO Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15 },
  qrCard: {
    borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 10,
  },
  qrTitle: { fontSize: 17, fontWeight: "800" },
  qrSub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  qrBox: {
    padding: 16, borderRadius: 14, borderWidth: 1, marginVertical: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  poNumber: { fontSize: 14, fontWeight: "800", letterSpacing: 1, marginTop: 4 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  summaryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  summaryLabel: { fontSize: 13, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: "700", flex: 1.5, textAlign: "right" },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 52, borderRadius: 14,
  },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
