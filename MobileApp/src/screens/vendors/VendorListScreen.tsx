import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { vendorService } from "../../services/vendorService";
import { Vendor } from "../../services/mocks/mockData";
import { SkeletonListScreen } from "../../components/common/SkeletonLoader";

const StatusBadge = ({ active, approved }: { active: boolean; approved: boolean }) => {
  const { colors } = useTheme();
  if (!active) return (
    <View style={[styles.badge, { backgroundColor: colors.danger + "20" }]}>
      <Text style={[styles.badgeText, { color: colors.danger }]}>Inactive</Text>
    </View>
  );
  if (!approved) return (
    <View style={[styles.badge, { backgroundColor: colors.warning + "20" }]}>
      <Text style={[styles.badgeText, { color: colors.warning }]}>Pending</Text>
    </View>
  );
  return (
    <View style={[styles.badge, { backgroundColor: colors.success + "20" }]}>
      <Text style={[styles.badgeText, { color: colors.success }]}>Approved</Text>
    </View>
  );
};

const VendorCard = ({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${vendor.company_name} profile`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.initials, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.initialsText, { color: colors.primary }]}>
            {vendor.company_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.companyName, { color: colors.text }]}>{vendor.company_name}</Text>
          <Text style={[styles.contactName, { color: colors.textMuted }]}>{vendor.contact_person}</Text>
        </View>
        <StatusBadge active={vendor.is_active} approved={vendor.is_approved} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="star" size={14} color={colors.accent} />
          <Text style={[styles.footerText, { color: colors.text }]}>{vendor.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="tag-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>{vendor.category.join(", ")}</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="package-variant" size={14} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>{vendor.total_orders} orders</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const VendorListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendors"],
    queryFn: vendorService.getVendors,
  });

  const filtered = data.filter((v: Vendor) => {
    const matchSearch =
      v.company_name.toLowerCase().includes(search.toLowerCase()) ||
      v.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      v.category.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filter === "all"
        ? true
        : filter === "approved"
        ? v.is_approved && v.is_active
        : !v.is_approved;
    return matchSearch && matchFilter;
  });

  if (isLoading && data.length === 0) {
    return <SkeletonListScreen count={5} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search vendors, categories..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["all", "approved", "pending"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && { backgroundColor: colors.primary }, { borderColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, { color: filter === f ? "#fff" : colors.primary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("VendorCreate")}
          accessibilityRole="button"
          accessibilityLabel="Invite new vendor"
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            onPress={() => navigation.navigate("VendorDetail", { vendorId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="store-off-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No vendors found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10, alignItems: "center" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginLeft: "auto", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  list: { padding: 16, paddingTop: 4, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  initialsText: { fontSize: 16, fontWeight: "800" },
  cardMeta: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: "700" },
  contactName: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 10 },
  cardFooter: { flexDirection: "row", gap: 14 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 12, fontWeight: "500" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
