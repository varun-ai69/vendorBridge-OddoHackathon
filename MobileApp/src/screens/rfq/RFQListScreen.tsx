import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { rfqService } from "../../services/rfqService";
import { RFQ } from "../../services/mocks/mockData";
import { SkeletonListScreen } from "../../components/common/SkeletonLoader";

const STATUS_META: Record<string, { color: string; icon: string; label: string }> = {
  draft:     { color: "#94a3b8", icon: "pencil-outline",       label: "Draft" },
  sent:      { color: "#0ea5e9", icon: "email-fast-outline",   label: "Sent" },
  closed:    { color: "#8b5cf6", icon: "lock-outline",         label: "Closed" },
  awarded:   { color: "#10b981", icon: "trophy-outline",       label: "Awarded" },
  cancelled: { color: "#ef4444", icon: "cancel",               label: "Cancelled" },
};

const RFQCard = ({ rfq, onPress }: { rfq: RFQ; onPress: () => void }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[rfq.status] ?? STATUS_META.draft;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View RFQ ${rfq.rfq_number}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.rfqNumRow}>
          <Text style={[styles.rfqNum, { color: colors.primary }]}>{rfq.rfq_number}</Text>
          <View style={[styles.badge, { backgroundColor: meta.color + "22" }]}>
            <MaterialCommunityIcons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={[styles.rfqTitle, { color: colors.text }]}>{rfq.title}</Text>
        <Text style={[styles.rfqDesc, { color: colors.textMuted }]} numberOfLines={2}>
          {rfq.description}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

      <View style={styles.cardBottom}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {format(new Date(rfq.deadline), "dd MMM yyyy")}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="format-list-bulleted" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{rfq.items.length} items</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="storefront-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{rfq.vendor_ids.length} vendors</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const RFQListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rfqs"],
    queryFn: rfqService.getRFQs,
  });

  const filtered = data.filter((r: RFQ) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.rfq_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isPO = user?.role === "procurement_officer";
  const statuses = ["all", "sent", "draft", "closed", "awarded", "cancelled"];

  if (isLoading && data.length === 0) {
    return <SkeletonListScreen count={4} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search RFQs..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {isPO && (
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("RFQCreate")}
            accessibilityRole="button"
            accessibilityLabel="Create new RFQ"
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={statuses}
        keyExtractor={(s) => s}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = statusFilter === item;
          const meta = STATUS_META[item];
          return (
            <TouchableOpacity
              style={[styles.chip, active && { backgroundColor: colors.primary }, { borderColor: active ? colors.primary : colors.surfaceBorder }]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.textMuted }]}>
                {item === "all" ? "All" : (meta?.label ?? item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <RFQCard rfq={item} onPress={() => navigation.navigate("RFQDetail", { rfqId: item.id })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="file-edit-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No RFQs found
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
    marginHorizontal: 16, marginTop: 14, marginBottom: 6,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  createBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  filterList: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, paddingTop: 4, gap: 12 },
  card: {
    borderRadius: 14, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  cardTop: { padding: 14 },
  rfqNumRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  rfqNum: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  rfqTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  rfqDesc: { fontSize: 13, lineHeight: 19 },
  divider: { height: 1 },
  cardBottom: { flexDirection: "row", gap: 16, padding: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
