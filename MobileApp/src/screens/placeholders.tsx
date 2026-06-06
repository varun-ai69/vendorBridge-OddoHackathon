import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { LoadingButton } from "../components/common/LoadingButton";
import { useAuthStore } from "../store/authStore";

// Base screen wrapper styling
const createPlaceholder = (name: string) => {
  return () => {
    const { colors } = useTheme();
    const { clearAuth } = useAuthStore();

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Mobile App Screen Placeholder
        </Text>
        {name !== "Login" && (
          <LoadingButton
            label="Logout Session"
            variant="outline"
            onPress={clearAuth}
            buttonStyle={styles.logoutButton}
          />
        )}
      </View>
    );
  };
};

// Auth Stack Placeholders
export const ForgotPasswordScreen = createPlaceholder("Forgot Password");
export const ResetPasswordScreen = createPlaceholder("Reset Password");

// Dashboard Placeholders
export const AdminDashboardScreen = createPlaceholder("Admin Dashboard");
export const PODashboardScreen = createPlaceholder("Procurement Officer Dashboard");
export const ManagerDashboardScreen = createPlaceholder("Manager Dashboard");
export const VendorDashboardScreen = createPlaceholder("Vendor Dashboard");

// Vendor Management Placeholders
export const VendorListScreen = createPlaceholder("Vendor Directory");
export const VendorDetailScreen = createPlaceholder("Vendor Profile Details");
export const VendorCreateScreen = createPlaceholder("Invite Supplier Account");

// RFQ Placeholders
export const RFQListScreen = createPlaceholder("RFQ Matrix");
export const RFQDetailScreen = createPlaceholder("RFQ Specifications View");
export const RFQCreateWizardScreen = createPlaceholder("Create RFQ Wizard (3 Steps)");
export const ComparisonScreen = createPlaceholder("Quotation Side-by-Side Comparison");

// Approvals Placeholders
export const ApprovalsListScreen = createPlaceholder("Manager Approvals Queue");
export const ApprovalDetailScreen = createPlaceholder("Approval Action Screen");

// PO & Invoice Placeholders
export const POListScreen = createPlaceholder("Purchase Orders Inventory");
export const PODetailScreen = createPlaceholder("PO details & PDF Viewer");
export const InvoiceListScreen = createPlaceholder("Invoices Management");
export const InvoiceDetailScreen = createPlaceholder("Invoice Ledger Sheet");

// Reports & Logs Placeholders
export const ReportsAnalyticsScreen = createPlaceholder("Reports & spend Analytics");
export const ActivityLogsScreen = createPlaceholder("Activity Logs Audit Trail");

// Settings Placeholders
export const SettingsScreen = createPlaceholder("App Settings & Configuration");
export const ChangePasswordScreen = createPlaceholder("Change Profile Password");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 20,
    width: 200,
  },
});
