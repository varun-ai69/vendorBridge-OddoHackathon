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
import { BlurView } from "expo-blur";

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
  const { colors, isDark } = useTheme();
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
      let authData;
      if (useMocks) {
        // Authenticate using mock layer
        authData = await mockService.login(data.email);
      } else {
        // Authenticate via live API
        const response = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
        });
        authData = response.data;
      }

      // Proceed to dashboard
      await setAuth(authData.token, authData.refresh_token, authData.user);
    } catch (error: any) {
      Alert.alert("Authentication Failed", error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (role: UserRole) => {
    const credentials = {
      admin: { email: "admin@vendorbridge.com", pass: "Demo@12345" },
      procurement_officer: { email: "procurement@vendorbridge.com", pass: "Demo@12345" },
      manager: { email: "manager@vendorbridge.com", pass: "Demo@12345" },
      vendor: { email: "vendor1@steelsuppliers.com", pass: "Demo@12345" },
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
    if (role === "manager") return colors.success;
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
          <Text style={[styles.title, { color: colors.text }]}>Vendorland</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Procurement & Vendor ERP Portal
          </Text>
        </View>

        <BlurView 
          intensity={isDark ? 40 : 60} 
          tint={isDark ? "dark" : "light"} 
          style={[styles.card, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}
        >
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
          </View>
        </BlurView>

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
    fontFamily: "PlusJakartaSans_700Bold",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_400Regular",
    height: "100%",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  demoChipText: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
  },
});
