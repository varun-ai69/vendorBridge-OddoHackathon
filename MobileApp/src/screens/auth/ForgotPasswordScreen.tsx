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
  email: yup.string().email("Enter a valid email").required("Email is required"),
});

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === "true";
      if (!useMocks) {
        await api.post("/auth/forgot-password", { email: data.email });
      }
      setSent(true);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="email-check-outline" size={80} color={colors.success} />
        <Text style={[styles.sentTitle, { color: colors.text }]}>Check your inbox!</Text>
        <Text style={[styles.sentSubtitle, { color: colors.textMuted }]}>
          A password reset link has been sent to your email address.
        </Text>
        <LoadingButton
          label="Back to Login"
          onPress={() => navigation.navigate("Login")}
          buttonStyle={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.wrapper, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MaterialCommunityIcons name="lock-reset" size={60} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Enter your email and we'll send a reset link.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputRow, { borderColor: errors.email ? colors.danger : colors.surfaceBorder }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.email && <Text style={[styles.error, { color: colors.danger }]}>{errors.email.message}</Text>}
        </View>

        <LoadingButton
          label="Send Reset Link"
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
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  icon: { alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 32, lineHeight: 22 },
  sentTitle: { fontSize: 22, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  sentSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 10, height: 50, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: "100%" },
  error: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  submitBtn: { height: 52, marginTop: 8 },
  backBtn: { marginTop: 24, height: 50, width: 220 },
});
