import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { rfqService } from "../../services/rfqService";
import { vendorService } from "../../services/vendorService";
import { LoadingButton } from "../../components/common/LoadingButton";

const STEPS = ["Specifications", "Line Items", "Select Vendors"];

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
  deadline: yup.string().required("Deadline is required"),
  delivery_location: yup.string().required("Delivery location is required"),
  notes: yup.string().optional(),
  items: yup.array().of(
    yup.object().shape({
      product_name: yup.string().required("Product name required"),
      description: yup.string().optional(),
      quantity: yup.number().min(1, "Qty must be ≥ 1").required("Quantity required"),
      unit: yup.string().required("Unit required"),
      specifications: yup.string().optional(),
    })
  ).min(1, "Add at least one line item"),
});

export const RFQCreateWizardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const DRAFT_KEY = `rfq_draft_${user?.id}`;

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: vendorService.getVendors,
  });
  const approvedVendors = vendors.filter((v: any) => v.is_approved && v.is_active);

  const { control, handleSubmit, watch, getValues, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: "", description: "", deadline: "", delivery_location: "", notes: "",
      items: [{ product_name: "", description: "", quantity: 1, unit: "pieces", specifications: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Auto-save draft on change
  const formValues = watch();
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
      } catch { }
    };
    save();
  }, [JSON.stringify(formValues)]);

  // Load draft on mount
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          reset(parsed);
          Toast.show({ type: "info", text1: "Draft Restored", text2: "Your previous draft was loaded." });
        }
      } catch { }
    };
    load();
  }, []);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      rfqService.createRFQ({ ...data, vendor_ids: selectedVendors, attachment_urls: [] }),
    onSuccess: async () => {
      await AsyncStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      Toast.show({ type: "success", text1: "RFQ Created!", text2: "Invitations sent to selected vendors." });
      navigation.goBack();
    },
    onError: () => Alert.alert("Error", "Failed to create RFQ. Please try again."),
  });

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit((data) => mutation.mutate(data))();
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      {/* Step Progress */}
      <View style={[styles.stepBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? colors.primary : colors.surfaceBorder }]}>
              {i < step
                ? <MaterialCommunityIcons name="check" size={14} color="#fff" />
                : <Text style={[styles.stepNum, { color: i === step ? "#fff" : colors.textMuted }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, { color: i === step ? colors.primary : colors.textMuted }]}>{s}</Text>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? colors.primary : colors.surfaceBorder }]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Step 1: Specifications */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>RFQ Details</Text>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
              <Controller control={control} name="title" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor: errors.title ? colors.danger : colors.surfaceBorder, color: colors.text }]}
                  placeholder="e.g. Steel Rods Q3 2026"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={onChange} value={value}
                />
              )} />
              {errors.title && <Text style={[styles.error, { color: colors.danger }]}>{errors.title.message}</Text>}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textArea, { borderColor: errors.description ? colors.danger : colors.surfaceBorder, color: colors.text }]}
                  placeholder="Describe the procurement requirement..."
                  placeholderTextColor={colors.textMuted}
                  onChangeText={onChange} value={value}
                  multiline numberOfLines={4}
                />
              )} />
              {errors.description && <Text style={[styles.error, { color: colors.danger }]}>{errors.description.message}</Text>}
            </View>

            {/* Deadline */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Deadline (YYYY-MM-DD) *</Text>
              <Controller control={control} name="deadline" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor: errors.deadline ? colors.danger : colors.surfaceBorder, color: colors.text }]}
                  placeholder="2026-08-01"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={onChange} value={value}
                />
              )} />
              {errors.deadline && <Text style={[styles.error, { color: colors.danger }]}>{errors.deadline.message}</Text>}
            </View>

            {/* Delivery Location */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Delivery Location *</Text>
              <Controller control={control} name="delivery_location" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor: errors.delivery_location ? colors.danger : colors.surfaceBorder, color: colors.text }]}
                  placeholder="Factory, City, PIN"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={onChange} value={value}
                />
              )} />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textArea, { borderColor: colors.surfaceBorder, color: colors.text }]}
                  placeholder="Any special instructions..."
                  placeholderTextColor={colors.textMuted}
                  onChangeText={onChange} value={value ?? ""}
                  multiline numberOfLines={3}
                />
              )} />
            </View>
          </View>
        )}

        {/* Step 2: Line Items */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Line Items</Text>

            {fields.map((field, idx) => (
              <View key={field.id} style={[styles.itemCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemNum, { color: colors.primary }]}>Item {idx + 1}</Text>
                  {fields.length > 1 && (
                    <TouchableOpacity onPress={() => remove(idx)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                <Controller control={control} name={`items.${idx}.product_name`} render={({ field: { onChange, value } }) => (
                  <TextInput style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text, marginBottom: 8 }]}
                    placeholder="Product name *" placeholderTextColor={colors.textMuted}
                    onChangeText={onChange} value={value} />
                )} />
                <Controller control={control} name={`items.${idx}.description`} render={({ field: { onChange, value } }) => (
                  <TextInput style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text, marginBottom: 8 }]}
                    placeholder="Description" placeholderTextColor={colors.textMuted}
                    onChangeText={onChange} value={value ?? ""} />
                )} />
                <View style={styles.rowInputs}>
                  <Controller control={control} name={`items.${idx}.quantity`} render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.input, styles.halfInput, { borderColor: colors.surfaceBorder, color: colors.text }]}
                      placeholder="Qty *" placeholderTextColor={colors.textMuted}
                      onChangeText={(t) => onChange(parseInt(t) || 0)} value={String(value)} keyboardType="numeric" />
                  )} />
                  <Controller control={control} name={`items.${idx}.unit`} render={({ field: { onChange, value } }) => (
                    <TextInput style={[styles.input, styles.halfInput, { borderColor: colors.surfaceBorder, color: colors.text }]}
                      placeholder="Unit *" placeholderTextColor={colors.textMuted}
                      onChangeText={onChange} value={value} />
                  )} />
                </View>
                <Controller control={control} name={`items.${idx}.specifications`} render={({ field: { onChange, value } }) => (
                  <TextInput style={[styles.input, { borderColor: colors.surfaceBorder, color: colors.text }]}
                    placeholder="Specifications" placeholderTextColor={colors.textMuted}
                    onChangeText={onChange} value={value ?? ""} />
                )} />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addItemBtn, { borderColor: colors.primary }]}
              onPress={() => append({ product_name: "", description: "", quantity: 1, unit: "pieces", specifications: "" })}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>Add Line Item</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Vendor Selection */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Vendors</Text>
            <Text style={[styles.subTitle, { color: colors.textMuted }]}>
              Only approved & active vendors shown. {selectedVendors.length} selected.
            </Text>

            {approvedVendors.map((v: any) => {
              const selected = selectedVendors.includes(v.id);
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vendorRow, { backgroundColor: colors.cardBg, borderColor: selected ? colors.primary : colors.surfaceBorder }]}
                  onPress={() => toggleVendor(v.id)}
                >
                  <View style={[styles.checkbox, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primary : "transparent" }]}>
                    {selected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                  <View style={styles.vendorInfo}>
                    <Text style={[styles.vendorName, { color: colors.text }]}>{v.company_name}</Text>
                    <Text style={[styles.vendorCat, { color: colors.textMuted }]}>{v.category.join(", ")}</Text>
                  </View>
                  <View style={styles.vendorRating}>
                    <MaterialCommunityIcons name="star" size={14} color={colors.accent} />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{v.rating.toFixed(1)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {approvedVendors.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No approved vendors available.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: colors.surfaceBorder }]} onPress={goBack}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>{step === 0 ? "Cancel" : "Back"}</Text>
        </TouchableOpacity>
        <LoadingButton
          label={step === STEPS.length - 1 ? (selectedVendors.length > 0 ? "Send RFQ" : "Select Vendors First") : "Next →"}
          isLoading={mutation.isPending}
          onPress={step === STEPS.length - 1 && selectedVendors.length === 0 ? undefined : goNext}
          buttonStyle={styles.nextBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  stepBar: {
    flexDirection: "row", paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, justifyContent: "center",
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  stepNum: { fontSize: 13, fontWeight: "700" },
  stepLabel: { fontSize: 11, fontWeight: "600", marginLeft: 6, marginRight: 6 },
  stepLine: { width: 24, height: 2, borderRadius: 1 },
  scroll: { padding: 16, paddingBottom: 20 },
  stepContent: { gap: 0 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 16 },
  subTitle: { fontSize: 13, marginBottom: 14 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 7 },
  input: {
    borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15,
  },
  textArea: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15,
    height: 90, textAlignVertical: "top",
  },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  itemCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12, gap: 8 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemNum: { fontSize: 13, fontWeight: "700" },
  rowInputs: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  addItemBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
  },
  addItemText: { fontSize: 14, fontWeight: "700" },
  vendorRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    justifyContent: "center", alignItems: "center",
  },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 14, fontWeight: "700" },
  vendorCat: { fontSize: 12, marginTop: 2 },
  vendorRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "700" },
  emptyText: { textAlign: "center", paddingVertical: 40 },
  navBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  nextBtn: { flex: 1, height: 48 },
});
