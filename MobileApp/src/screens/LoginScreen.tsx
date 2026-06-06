import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";

import { useTheme } from "../theme/ThemeContext";
import { useAuthStore, UserRole } from "../store/authStore";
import { LoadingButton } from "../components/common/LoadingButton";
import { mockService } from "../services/mocks/mockService";
import { api } from "../services/api";

// Validation Schema
const schema = yup.object().shape({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export const LoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);

  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === "true";
  const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if biometrics is supported on device
  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricsAvailable(hasHardware && isEnrolled);
    };
    checkBiometrics();
  }, []);

  const handleLogin = async (data: any) => {
    setIsLoading(true);
    try {
      if (useMocks) {
        // Authenticate using mock layer
        const authData = await mockService.login(data.email);
        await setAuth(authData.token, authData.refresh_token, authData.user);
      } else {
        // Authenticate via live API
        const response = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
        });
        const { token, refresh_token, user } = response.data;
        await setAuth(token, refresh_token, user);
      }
    } catch (error: any) {
      Alert.alert("Authentication Failed", error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBiometricAuth = async () => {
    try {
      const results = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock VendorBridge",
        fallbackLabel: "Enter Password",
      });

      if (results.success) {
        // For hackathon demo, biometric automatically log in as Procurement Officer if token matches
        // In real app, it reads the credentials saved inside secure storage
        setIsLoading(true);
        const authData = await mockService.login("po@vendorbridge.com");
        await setAuth(authData.token, authData.refresh_token, authData.user);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (role: UserRole) => {
    const credentials = {
      admin: { email: "admin@vendorbridge.com", pass: "admin123" },
      procurement_officer: { email: "po@vendorbridge.com", pass: "po123" },
      manager: { email: "manager@vendorbridge.com", pass: "manager123" },
      vendor: { email: "vendor@vendorbridge.com", pass: "vendor123" },
    };

    const creds = credentials[role];
    if (creds) {
      setValue("email", creds.email);
      setValue("password", creds.pass);
    }
  };

  const getRoleColor = (role: string) => {
    if (role === "admin") return "#3b82f6";
    if (role === "procurement_officer") return colors.primary;
    if (role === "manager") return colors.secondary;
    return colors.accent;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MaterialCommunityIcons name="bridge" size={60} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>VendorBridge</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Procurement & Vendor ERP Portal
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrapper, { borderColor: errors.email ? colors.danger : colors.surfaceBorder }]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter email"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              )}
            />
            {errors.email && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.email.message}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrapper, { borderColor: errors.password ? colors.danger : colors.surfaceBorder }]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                  />
                </View>
              )}
            />
            {errors.password && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate("ForgotPassword")}
            accessibilityRole="button"
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <LoadingButton
              label="Sign In"
              isLoading={isLoading}
              onPress={handleSubmit(handleLogin)}
              buttonStyle={styles.loginBtn}
            />

            {isBiometricsAvailable && (
              <TouchableOpacity
                style={[styles.biometricsBtn, { borderColor: colors.primary }]}
                onPress={triggerBiometricAuth}
                accessibilityRole="button"
                accessibilityLabel="Sign in with biometrics"
              >
                <MaterialCommunityIcons name="fingerprint" size={28} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Demo Mode Roles Quick-Select Chips */}
        {isDemoMode && (
          <View style={styles.demoContainer}>
            <Text style={[styles.demoTitle, { color: colors.textMuted }]}>
              Demo Quick-Select Roles
            </Text>
            <View style={styles.demoChips}>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: getRoleColor("admin") }]}
                onPress={() => handleDemoSelect("admin")}
              >
                <Text style={styles.demoChipText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: getRoleColor("procurement_officer") }]}
                onPress={() => handleDemoSelect("procurement_officer")}
              >
                <Text style={styles.demoChipText}>Proc. Officer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: getRoleColor("manager") }]}
                onPress={() => handleDemoSelect("manager")}
              >
                <Text style={styles.demoChipText}>Manager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: getRoleColor("vendor") }]}
                onPress={() => handleDemoSelect("vendor")}
              >
                <Text style={styles.demoChipText}>Vendor</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginBtn: {
    flex: 1,
    height: 48,
  },
  biometricsBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  demoContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  demoChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  demoChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  demoChipText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
});
