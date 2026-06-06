import React, { useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../theme/ThemeContext";
import { useNotifStore, NotificationItem } from "../../store/notifStore";
import { mockService } from "../../services/mocks/mockService";
import { api } from "../../services/api";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

const TYPE_META: Record<NotificationItem["type"], { icon: string; color: string }> = {
  rfq:       { icon: "file-edit-outline",        color: "#0ea5e9" },
  quotation: { icon: "file-send-outline",         color: "#8b5cf6" },
  approval:  { icon: "check-circle-outline",      color: "#f59e0b" },
  po:        { icon: "file-document-outline",     color: "#10b981" },
  invoice:   { icon: "receipt-text-outline",      color: "#ef4444" },
};

export const NotificationsScreen = () => {
  const { colors } = useTheme();
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotifStore();

  const { isRefetching, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const data = USE_MOCKS
        ? await mockService.getNotifications()
        : await api.get("/notifications").then((r) => r.data.notifications ?? r.data);
      setNotifications(data);
      return data;
    },
    refetchInterval: 30_000, // poll every 30 sec
  });

  const handleMarkRead = (id: string, wasRead: boolean) => {
    if (!wasRead) {
      Haptics.selectionAsync();
      markAsRead(id);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const meta = TYPE_META[item.type] ?? { icon: "bell-outline", color: colors.textMuted };
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: item.is_read ? colors.cardBg : colors.primary + "0A",
            borderColor: item.is_read ? colors.surfaceBorder : colors.primary + "40",
          },
        ]}
        onPress={() => handleMarkRead(item.id, item.is_read)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={[styles.iconBox, { backgroundColor: meta.color + "18" }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text style={[styles.message, { color: colors.textMuted }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Actions */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllRow, { borderBottomColor: colors.surfaceBorder }]}
          onPress={() => {
            Haptics.selectionAsync();
            markAllAsRead();
          }}
        >
          <MaterialCommunityIcons name="check-all" size={16} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Mark all as read ({unreadCount})
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No notifications yet. They'll appear here when something needs your attention.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAllRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  markAllText: { fontSize: 13, fontWeight: "700" },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  body: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 14, fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  message: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
