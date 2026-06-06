import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";

// Import Placeholders
import {
  ForgotPasswordScreen,
  ResetPasswordScreen,
  AdminDashboardScreen,
  PODashboardScreen,
  ManagerDashboardScreen,
  VendorDashboardScreen,
  VendorListScreen,
  VendorDetailScreen,
  VendorCreateScreen,
  RFQListScreen,
  RFQDetailScreen,
  RFQCreateWizardScreen,
  ComparisonScreen,
  ApprovalsListScreen,
  ApprovalDetailScreen,
  POListScreen,
  PODetailScreen,
  InvoiceListScreen,
  InvoiceDetailScreen,
  ReportsAnalyticsScreen,
  ActivityLogsScreen,
  SettingsScreen,
  ChangePasswordScreen,
} from "../screens/placeholders";

// Import Login Screen (We will implement the real LoginScreen next)
import { LoginScreen } from "../screens/LoginScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// --- Deep Linking Configuration ---
const linking: any = {
  prefixes: ["vendorbridge://"],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: "reset-password",
        },
      },
    },
  },
};

// --- Shared Settings Stack ---
const SettingsStackScreen = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change Password" }} />
  </Stack.Navigator>
);

// --- 1. Auth Stack ---
const AuthStackScreen = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: "Forgot Password" }} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: true, title: "Reset Password" }} />
  </Stack.Navigator>
);

// --- 2. Admin Flow ---
const AdminVendorsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="VendorList" component={VendorListScreen} options={{ title: "Suppliers" }} />
    <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ title: "Supplier Profile" }} />
    <Stack.Screen name="VendorCreate" component={VendorCreateScreen} options={{ title: "Invite Supplier" }} />
  </Stack.Navigator>
);

const AdminTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "help-circle";
          if (route.name === "Home") iconName = "view-dashboard";
          else if (route.name === "Vendors") iconName = "storefront";
          else if (route.name === "Logs") iconName = "file-document-outline";
          else if (route.name === "Preferences") iconName = "cog";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={AdminDashboardScreen} />
      <Tab.Screen name="Vendors" component={AdminVendorsStack} />
      <Tab.Screen name="Logs" component={ActivityLogsScreen} />
      <Tab.Screen name="Preferences" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
};

const AdminNavigator = () => {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.surface },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
      }}
    >
      <Drawer.Screen name="Dashboard" component={AdminTabs} />
      <Drawer.Screen name="Vendor Registry" component={AdminVendorsStack} />
      <Drawer.Screen name="Audit Trail" component={ActivityLogsScreen} />
      <Drawer.Screen name="Settings" component={SettingsStackScreen} />
    </Drawer.Navigator>
  );
};

// --- 3. Procurement Officer Flow ---
const PORFQStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="RFQList" component={RFQListScreen} options={{ title: "Requests for Quotation" }} />
    <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title: "RFQ Specs" }} />
    <Stack.Screen name="RFQCreate" component={RFQCreateWizardScreen} options={{ title: "New RFQ Wizard" }} />
    <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: "Compare Bids" }} />
  </Stack.Navigator>
);

const POFinanceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="POList" component={POListScreen} options={{ title: "Purchase Orders" }} />
    <Stack.Screen name="PODetail" component={PODetailScreen} options={{ title: "Purchase Order Specs" }} />
    <Stack.Screen name="InvoiceList" component={InvoiceListScreen} options={{ title: "Invoices Log" }} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "Invoice Ledger" }} />
  </Stack.Navigator>
);

const ProcurementTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "help-circle";
          if (route.name === "Home") iconName = "view-dashboard";
          else if (route.name === "RFQs") iconName = "file-edit-outline";
          else if (route.name === "Orders") iconName = "file-receipt-outline";
          else if (route.name === "Preferences") iconName = "cog";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={PODashboardScreen} />
      <Tab.Screen name="RFQs" component={PORFQStack} />
      <Tab.Screen name="Orders" component={POFinanceStack} />
      <Tab.Screen name="Preferences" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
};

const ProcurementNavigator = () => {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Drawer.Screen name="Dashboard" component={ProcurementTabs} />
      <Drawer.Screen name="RFQs & Bids" component={PORFQStack} />
      <Drawer.Screen name="POs & Invoices" component={POFinanceStack} />
      <Drawer.Screen name="Analytics" component={ReportsAnalyticsScreen} />
      <Drawer.Screen name="Settings" component={SettingsStackScreen} />
    </Drawer.Navigator>
  );
};

// --- 4. Manager Flow ---
const ManagerApprovalsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="ApprovalsList" component={ApprovalsListScreen} options={{ title: "Pending Approvals" }} />
    <Stack.Screen name="ApprovalDetail" component={ApprovalDetailScreen} options={{ title: "Review Details" }} />
  </Stack.Navigator>
);

const ManagerTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "help-circle";
          if (route.name === "Home") iconName = "view-dashboard";
          else if (route.name === "Approvals") iconName = "checkbox-marked-circle-outline";
          else if (route.name === "Preferences") iconName = "cog";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ManagerDashboardScreen} />
      <Tab.Screen name="Approvals" component={ManagerApprovalsStack} />
      <Tab.Screen name="Preferences" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
};

const ManagerNavigator = () => {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Drawer.Screen name="Dashboard" component={ManagerTabs} />
      <Drawer.Screen name="Approvals List" component={ManagerApprovalsStack} />
      <Drawer.Screen name="Reports & Charts" component={ReportsAnalyticsScreen} />
      <Drawer.Screen name="Settings" component={SettingsStackScreen} />
    </Drawer.Navigator>
  );
};

// --- 5. Vendor Flow ---
const VendorRFQStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="RFQList" component={RFQListScreen} options={{ title: "Supplier Invitations" }} />
    <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title: "RFQ Request Specs" }} />
  </Stack.Navigator>
);

const VendorQuotationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title: "Bid Specifications" }} />
    <Stack.Screen name="QuoteSubmit" component={ForgotPasswordScreen} options={{ title: "Submit Bids" }} />
  </Stack.Navigator>
);

const VendorPOInvoiceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="POList" component={POListScreen} options={{ title: "Assigned Purchase Orders" }} />
    <Stack.Screen name="PODetail" component={PODetailScreen} options={{ title: "PO Overview" }} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "Invoice Ledger" }} />
  </Stack.Navigator>
);

const VendorTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "help-circle";
          if (route.name === "Home") iconName = "view-dashboard";
          else if (route.name === "RFQs Inbox") iconName = "email-open-outline";
          else if (route.name === "Orders") iconName = "file-receipt-outline";
          else if (route.name === "Preferences") iconName = "cog";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={VendorDashboardScreen} />
      <Tab.Screen name="RFQs Inbox" component={VendorRFQStack} />
      <Tab.Screen name="Orders" component={VendorPOInvoiceStack} />
      <Tab.Screen name="Preferences" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
};

const VendorNavigator = () => {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.surface },
      }}
    >
      <Drawer.Screen name="Dashboard" component={VendorTabs} />
      <Drawer.Screen name="Bidding Invitations" component={VendorRFQStack} />
      <Drawer.Screen name="Purchase Orders" component={VendorPOInvoiceStack} />
      <Drawer.Screen name="Settings" component={SettingsStackScreen} />
    </Drawer.Navigator>
  );
};

// --- Main AppNavigator ---
export const AppNavigator = () => {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { colors } = useTheme();

  // If loading secure keys on startup, show branded spinner
  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStackScreen} />
        ) : (
          <>
            {user?.role === "admin" && (
              <Stack.Screen name="AdminApp" component={AdminNavigator} />
            )}
            {user?.role === "procurement_officer" && (
              <Stack.Screen name="ProcurementApp" component={ProcurementNavigator} />
            )}
            {user?.role === "manager" && (
              <Stack.Screen name="ManagerApp" component={ManagerNavigator} />
            )}
            {user?.role === "vendor" && (
              <Stack.Screen name="VendorApp" component={VendorNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
