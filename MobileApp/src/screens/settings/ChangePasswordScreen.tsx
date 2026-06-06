import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { useTheme } from "../../theme/ThemeContext";
import { LoadingButton } from "../../components/common/LoadingButton";
import { api } from "../../services/api";

const schema = yup.object().shape({
  current_password: yup.string().required("Current password is required"),
  new_password: yup
    .string()
    .min(8, "At least 8 characters")
    .matches(/[A-Z]/, "Must have an uppercase letter")
    .matches(/[0-9]/, "Must have a number")
    .required("New password is required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "Passwords do not match")
    .required("Confirm your password"),
});

export const ChangePasswordScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === "true";
      if (!useMocks) {
        await api.post("/auth/change-password", {
          current_password: data.current_password,
          new_password: data.new_password,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Password Updated", text2: "Your password has been changed successfully." });
      reset();
      navigation.goBack();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.response?.data?.message || "Failed to change password. Check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordField = ({ name, label, placeholder }: { name: any; label: string; placeholder: string }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputRow, { borderColor: (errors as any)[name] ? colors.danger : colors.surfaceBorder }]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
            />
            {name === "new_password" && (
              <MaterialCommunityIcons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.textMuted}
                onPress={() => setShowPass(!showPass)}
              />
            )}
          </View>
        )}
      />
      {(errors as any)[name] && (
        <Text style={[styles.error, { color: colors.danger }]}>{(errors as any)[name]?.message}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <View style={styles.iconHeader}>
            <MaterialCommunityIcons name="shield-key-outline" size={40} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Change Password</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Your new password must be at least 8 characters with one uppercase letter and one number.
            </Text>
          </View>

          <PasswordField name="current_password" label="Current Password *" placeholder="Enter current password" />
          <PasswordField name="new_password" label="New Password *" placeholder="Min 8 chars, 1 uppercase, 1 number" />
          <PasswordField name="confirm_password" label="Confirm New Password *" placeholder="Re-enter new password" />

          {/* Requirements checklist */}
          <View style={[styles.requirements, { backgroundColor: colors.primary + "0A", borderColor: colors.primary + "30" }]}>
            {[
              "At least 8 characters",
              "One uppercase letter (A-Z)",
              "One number (0-9)",
            ].map((req) => (
              <View key={req} style={styles.reqRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.primary} />
                <Text style={[styles.reqText, { color: colors.textMuted }]}>{req}</Text>
              </View>
            ))}
          </View>

          <LoadingButton
            label="Update Password"
            isLoading={isLoading}
            onPress={handleSubmit(onSubmit)}
            buttonStyle={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16, justifyContent: "center" },
  card: { borderRadius: 14, borderWidth: 1, padding: 20 },
  iconHeader: { alignItems: "center", marginBottom: 24, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: "800" },
  cardSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 7 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 12, gap: 8,
  },
  icon: {},
  input: { flex: 1, fontSize: 15, height: "100%" },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  requirements: {
    borderRadius: 10, borderWidth: 1, padding: 12, gap: 7, marginBottom: 20,
  },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqText: { fontSize: 12 },
  submitBtn: { height: 50, marginTop: 4 },
});
