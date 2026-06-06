import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { vendorService } from "../../services/vendorService";
import { LoadingButton } from "../../components/common/LoadingButton";

const schema = yup.object().shape({
  company_name: yup.string().required("Company name is required"),
  contact_person: yup.string().required("Contact person is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().min(10, "Enter a valid phone number").required("Phone is required"),
  address: yup.string().required("Address is required"),
  gst_number: yup.string().required("GST number is required"),
  pan_number: yup.string().required("PAN number is required"),
  category: yup.string().required("At least one category is required"),
  notes: yup.string().optional(),
});

const FieldInput = ({ control, name, label, icon, placeholder, errors, keyboardType = "default", multiline = false }: any) => {
  const { colors } = useTheme();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[
            styles.inputRow,
            multiline && styles.textAreaRow,
            { borderColor: errors[name] ? colors.danger : colors.surfaceBorder },
          ]}>
            <MaterialCommunityIcons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, multiline && styles.textArea, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType={keyboardType}
              autoCapitalize="none"
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
            />
          </View>
        )}
      />
      {errors[name] && <Text style={[styles.error, { color: colors.danger }]}>{errors[name]?.message}</Text>}
    </View>
  );
};

export const VendorCreateScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      company_name: "", contact_person: "", email: "", phone: "",
      address: "", gst_number: "", pan_number: "", category: "", notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      vendorService.createVendor({
        ...data,
        category: data.category.split(",").map((c: string) => c.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      Toast.show({ type: "success", text1: "Vendor Invited!", text2: "They'll receive an email shortly." });
      navigation.goBack();
    },
    onError: () => Alert.alert("Error", "Failed to invite vendor. Please try again."),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Company Info</Text>
          <FieldInput control={control} name="company_name" label="Company Name *" icon="domain" placeholder="Acme Supplies Ltd" errors={errors} />
          <FieldInput control={control} name="contact_person" label="Contact Person *" icon="account-outline" placeholder="Full name" errors={errors} />
          <FieldInput control={control} name="email" label="Business Email *" icon="email-outline" placeholder="vendor@company.com" errors={errors} keyboardType="email-address" />
          <FieldInput control={control} name="phone" label="Phone Number *" icon="phone-outline" placeholder="+91 9XXXXXXXXX" errors={errors} keyboardType="phone-pad" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tax & Location</Text>
          <FieldInput control={control} name="gst_number" label="GST Number *" icon="file-certificate-outline" placeholder="29ABCDE1234F1Z5" errors={errors} />
          <FieldInput control={control} name="pan_number" label="PAN Number *" icon="card-text-outline" placeholder="ABCDE1234F" errors={errors} />
          <FieldInput control={control} name="address" label="Registered Address *" icon="map-marker-outline" placeholder="Street, City, State, PIN" errors={errors} multiline={true} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Categories & Notes</Text>
          <FieldInput control={control} name="category" label="Categories * (comma-separated)" icon="tag-multiple-outline" placeholder="Raw Materials, Steel" errors={errors} />
          <FieldInput control={control} name="notes" label="Internal Notes (Optional)" icon="note-text-outline" placeholder="Any internal notes about this vendor..." errors={errors} multiline={true} />
        </View>

        <LoadingButton
          label="Send Invitation"
          isLoading={mutation.isPending}
          onPress={handleSubmit((data) => mutation.mutate(data))}
          buttonStyle={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 7 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 12,
  },
  textAreaRow: { height: undefined, paddingVertical: 10, alignItems: "flex-start" },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  textArea: { height: 70, textAlignVertical: "top" },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  submitBtn: { height: 52, marginTop: 4 },
});
