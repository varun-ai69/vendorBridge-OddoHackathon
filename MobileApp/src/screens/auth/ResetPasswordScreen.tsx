import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { LoadingButton } from "../../components/common/LoadingButton";
import { api } from "../../services/api";

const schema = yup.object().shape({
  new_password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .required("New password is required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const token = route?.params?.token || "";

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      Alert.alert("Invalid Link", "Reset token is missing. Please request a new reset link.");
      return;
    }
    setIsLoading(true);
    try {
      const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === "true";
      if (!useMocks) {
        await api.post("/auth/reset-password", {
          token,
          new_password: data.new_password,
        });
      }
      Alert.alert("Success", "Your password has been reset. Please log in.", [
        { text: "Go to Login", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to reset password. Link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MaterialCommunityIcons name="shield-key-outline" size={60} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Your new password must be at least 8 characters with one uppercase and one number.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
          <Controller
            control={control}
            name="new_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputRow, { borderColor: errors.new_password ? colors.danger : colors.surfaceBorder }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="New password"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                />
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>
            )}
          />
          {errors.new_password && <Text style={[styles.error, { color: colors.danger }]}>{errors.new_password.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputRow, { borderColor: errors.confirm_password ? colors.danger : colors.surfaceBorder }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                />
              </View>
            )}
          />
          {errors.confirm_password && <Text style={[styles.error, { color: colors.danger }]}>{errors.confirm_password.message}</Text>}
        </View>

        <LoadingButton
          label="Reset Password"
          isLoading={isLoading}
          onPress={handleSubmit(onSubmit)}
          buttonStyle={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  icon: { alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 32, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 10, height: 50, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: "100%" },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  submitBtn: { height: 52, marginTop: 16 },
});
