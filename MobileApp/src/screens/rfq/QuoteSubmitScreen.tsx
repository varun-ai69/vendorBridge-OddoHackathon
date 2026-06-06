import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from "react-native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { rfqService } from "../../services/rfqService";
import { mockService } from "../../services/mocks/mockService";
import { LoadingButton } from "../../components/common/LoadingButton";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

const schema = yup.object().shape({
  delivery_timeline_days: yup.number().min(1).required("Delivery days required"),
  delivery_terms: yup.string().required("Delivery terms required"),
  payment_terms: yup.string().required("Payment terms required"),
  validity_days: yup.number().min(1).required("Validity days required"),
  notes: yup.string().optional(),
  items: yup.array().of(
    yup.object().shape({
      unit_price: yup.number().min(0.01, "Price must be > 0").required("Unit price required"),
      tax_percent: yup.number().min(0).max(100).required("Tax % required"),
    })
  ),
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const QuoteSubmitScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { rfqId } = route.params;

  const { data: rfq } = useQuery({
    queryKey: ["rfq", rfqId],
    queryFn: () => rfqService.getRFQDetail(rfqId),
  });

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      delivery_timeline_days: 7,
      delivery_terms: "Ex-Works",
      payment_terms: "Net 30",
      validity_days: 30,
      notes: "",
      items: rfq?.items.map((item) => ({
        rfq_item_id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: 0,
        tax_percent: 18,
        subtotal: 0,
      })) ?? [],
    },
  });

  const { fields } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  // Calculate totals
  const lineItems = watchedItems ?? [];
  const subtotal = lineItems.reduce((sum: number, item: any) => {
    return sum + (item.unit_price || 0) * (item.quantity || 0);
  }, 0);
  const taxTotal = lineItems.reduce((sum: number, item: any) => {
    const itemSubtotal = (item.unit_price || 0) * (item.quantity || 0);
    return sum + itemSubtotal * ((item.tax_percent || 0) / 100);
  }, 0);
  const grandTotal = subtotal + taxTotal;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const quoteItems = data.items.map((item: any, idx: number) => ({
        id: `qi-new-${idx}`,
        rfq_item_id: item.rfq_item_id ?? rfq?.items[idx]?.id,
        product_name: item.product_name ?? rfq?.items[idx]?.product_name,
        unit_price: parseFloat(item.unit_price),
        quantity: rfq?.items[idx]?.quantity ?? 1,
        unit: item.unit ?? rfq?.items[idx]?.unit,
        tax_percent: parseFloat(item.tax_percent),
        subtotal: parseFloat(item.unit_price) * (rfq?.items[idx]?.quantity ?? 1),
      }));

      const payload = {
        ...data,
        items: quoteItems,
        total_amount: grandTotal,
        currency: "INR",
      };

      if (USE_MOCKS) return mockService.submitQuotation(rfqId, payload);
      const { api } = await import("../../services/api");
      const res = await api.post(`/rfqs/${rfqId}/quotations`, payload);
      return res.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["quotations", rfqId] });
      Toast.show({ type: "success", text1: "Bid Submitted!", text2: "Your quotation has been sent." });
      navigation.goBack();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to submit quotation. Please try again.");
    },
  });

  if (!rfq) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading RFQ details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* RFQ Reference Banner */}
        <View style={[styles.rfqBanner, { backgroundColor: colors.primary + "14", borderColor: colors.primary }]}>
          <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.rfqNum, { color: colors.primary }]}>{rfq.rfq_number}</Text>
            <Text style={[styles.rfqTitle, { color: colors.text }]}>{rfq.title}</Text>
          </View>
        </View>

        {/* Line Items Pricing */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your Pricing</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>Enter unit price and applicable GST for each item.</Text>

          {rfq.items.map((rfqItem, idx) => (
            <View key={rfqItem.id} style={[styles.itemBlock, { borderTopColor: colors.surfaceBorder }]}>
              <View style={styles.itemHeader}>
                <View style={[styles.itemBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.primary }]}>{idx + 1}</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{rfqItem.product_name}</Text>
                  <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                    Qty: {rfqItem.quantity} {rfqItem.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.halfField}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Unit Price (₹) *</Text>
                  <Controller
                    control={control}
                    name={`items.${idx}.unit_price`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.priceInput, { borderColor: (errors.items as any)?.[idx]?.unit_price ? colors.danger : colors.surfaceBorder, color: colors.text }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        onChangeText={(t) => onChange(parseFloat(t) || 0)}
                        value={value ? String(value) : ""}
                      />
                    )}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>GST %</Text>
                  <Controller
                    control={control}
                    name={`items.${idx}.tax_percent`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.priceInput, { borderColor: colors.surfaceBorder, color: colors.text }]}
                        placeholder="18"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        onChangeText={(t) => onChange(parseFloat(t) || 0)}
                        value={value ? String(value) : ""}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Live Line Total */}
              {(watchedItems?.[idx]?.unit_price ?? 0) > 0 && (
                <View style={[styles.lineTotal, { backgroundColor: colors.secondary + "10" }]}>
                  <Text style={[styles.lineTotalText, { color: colors.secondary }]}>
                    Line total: {fmt((watchedItems[idx].unit_price || 0) * rfqItem.quantity)} + {fmt((watchedItems[idx].unit_price || 0) * rfqItem.quantity * ((watchedItems[idx].tax_percent || 0) / 100))} GST
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Terms Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery & Terms</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Delivery Timeline (days) *</Text>
            <Controller control={control} name="delivery_timeline_days" render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="7"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                onChangeText={(t) => onChange(parseInt(t) || 0)}
                value={value ? String(value) : ""}
              />
            )} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Delivery Terms *</Text>
            <Controller control={control} name="delivery_terms" render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="Ex-Works, FOB, CIF..."
                placeholderTextColor={colors.textMuted}
                onChangeText={onChange}
                value={value}
              />
            )} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Payment Terms *</Text>
            <Controller control={control} name="payment_terms" render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="Net 30, Net 15, Advance..."
                placeholderTextColor={colors.textMuted}
                onChangeText={onChange}
                value={value}
              />
            )} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Quote Valid for (days) *</Text>
            <Controller control={control} name="validity_days" render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="30"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                onChangeText={(t) => onChange(parseInt(t) || 0)}
                value={value ? String(value) : ""}
              />
            )} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes (Optional)</Text>
            <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textArea, { borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="Any additional terms or notes..."
                placeholderTextColor={colors.textMuted}
                onChangeText={onChange}
                value={value ?? ""}
                multiline
                numberOfLines={3}
              />
            )} />
          </View>
        </View>

        {/* Grand Total Summary */}
        <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST</Text>
            <Text style={styles.totalValue}>{fmt(taxTotal)}</Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        <LoadingButton
          label="Submit Quotation"
          isLoading={mutation.isPending}
          onPress={handleSubmit((data) => mutation.mutate(data))}
          buttonStyle={[styles.submitBtn, { backgroundColor: colors.secondary }]}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15 },
  rfqBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  rfqNum: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  rfqTitle: { fontSize: 14, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 14 },
  itemBlock: { paddingTop: 14, borderTopWidth: 1, marginTop: 8 },
  itemHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  itemBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  itemBadgeText: { fontSize: 13, fontWeight: "800" },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "700" },
  itemQty: { fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  priceInput: {
    borderWidth: 1, borderRadius: 8, height: 42, paddingHorizontal: 12, fontSize: 15,
  },
  lineTotal: { marginTop: 8, padding: 8, borderRadius: 8 },
  lineTotalText: { fontSize: 12, fontWeight: "600" },
  fieldGroup: { marginBottom: 14 },
  input: { borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, height: 80, textAlignVertical: "top" },
  totalCard: { borderRadius: 14, padding: 18, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: "rgba(255,255,255,0.75)", fontSize: 14 },
  totalValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalDivider: { height: 1, marginVertical: 4 },
  grandLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  grandValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  submitBtn: { height: 52 },
});
