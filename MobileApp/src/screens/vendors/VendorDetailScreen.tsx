import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Alert, TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { vendorService } from "../../services/vendorService";
import { LoadingButton } from "../../components/common/LoadingButton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.surfaceBorder }]}>
      <MaterialCommunityIcons name={icon as any} size={16} color={colors.textMuted} style={styles.infoIcon} />
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

export const VendorDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { vendorId } = route.params;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ approve: boolean; active: boolean } | null>(null);

  const { data: vendor, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: () => vendorService.getVendorDetail(vendorId),
  });

  const mutation = useMutation({
    mutationFn: ({ is_approved, is_active }: { is_approved: boolean; is_active: boolean }) =>
      vendorService.updateVendorStatus(vendorId, is_approved, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", vendorId] });
    },
    onError: () => Alert.alert("Error", "Failed to update vendor status"),
  });

  const handleAction = (is_approved: boolean, is_active: boolean) => {
    setPendingAction({ approve: is_approved, active: is_active });
    setConfirmOpen(true);
  };

  const confirmAction = () => {
    if (pendingAction) mutation.mutate({ is_approved: pendingAction.approve, is_active: pendingAction.active });
    setConfirmOpen(false);
  };

  if (isLoading || !vendor) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="loading" size={32} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading vendor profile...</Text>
      </View>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{vendor.company_name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.companyName}>{vendor.company_name}</Text>
        <Text style={styles.contactName}>{vendor.contact_person}</Text>
        <View style={styles.tagRow}>
          {vendor.category.map((cat) => (
            <View key={cat} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <MaterialCommunityIcons name="star" size={18} color={colors.accent} />
          <Text style={[styles.statVal, { color: colors.text }]}>{vendor.rating.toFixed(1)}</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Rating</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <MaterialCommunityIcons name="package-variant-closed" size={18} color={colors.secondary} />
          <Text style={[styles.statVal, { color: colors.text }]}>{vendor.total_orders}</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Total Orders</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <MaterialCommunityIcons name="truck-check-outline" size={18} color={colors.success} />
          <Text style={[styles.statVal, { color: colors.text }]}>{vendor.on_time_delivery_rate}%</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>On-Time</Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.detailsCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Company Details</Text>
        <InfoRow icon="email-outline" label="Email" value={vendor.email} />
        <InfoRow icon="phone-outline" label="Phone" value={vendor.phone} />
        <InfoRow icon="map-marker-outline" label="Address" value={vendor.address} />
        <InfoRow icon="office-building-outline" label="GST No." value={vendor.gst_number} />
        <InfoRow icon="card-account-details-outline" label="PAN No." value={vendor.pan_number} />
        {vendor.notes && <InfoRow icon="note-text-outline" label="Notes" value={vendor.notes} />}
      </View>

      {/* Admin Actions */}
      {isAdmin && (
        <View style={styles.actionsBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin Actions</Text>
          {!vendor.is_approved ? (
            <LoadingButton
              label="Approve Vendor"
              isLoading={mutation.isPending}
              onPress={() => handleAction(true, true)}
              buttonStyle={[styles.btn, { backgroundColor: colors.success }]}
            />
          ) : (
            <LoadingButton
              label="Revoke Approval"
              isLoading={mutation.isPending}
              variant="outline"
              onPress={() => handleAction(false, true)}
              buttonStyle={styles.btn}
            />
          )}
          {vendor.is_active ? (
            <LoadingButton
              label="Deactivate Vendor"
              isLoading={mutation.isPending}
              variant="outline"
              onPress={() => handleAction(vendor.is_approved, false)}
              buttonStyle={[styles.btn, { borderColor: colors.danger }]}
            />
          ) : (
            <LoadingButton
              label="Reactivate Vendor"
              isLoading={mutation.isPending}
              onPress={() => handleAction(vendor.is_approved, true)}
              buttonStyle={[styles.btn, { backgroundColor: colors.info }]}
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visible={confirmOpen}
        title="Confirm Action"
        description={`Are you sure you want to ${pendingAction?.approve ? "approve" : "revoke approval for"} ${vendor.company_name}?`}
        confirmLabel="Proceed"
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15 },
  profileCard: { padding: 24, alignItems: "center", marginBottom: 16 },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  companyName: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  contactName: { color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 4, marginBottom: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  tag: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  statBox: {
    flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 4,
  },
  statVal: { fontSize: 18, fontWeight: "800" },
  statLbl: { fontSize: 11, fontWeight: "500" },
  detailsCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  infoIcon: { width: 24 },
  infoLabel: { width: 70, fontSize: 13 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: "600", textAlign: "right" },
  actionsBlock: { paddingHorizontal: 16, gap: 10 },
  btn: { height: 48, marginBottom: 0 },
});
