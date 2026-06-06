import React from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useTheme } from "../../theme/ThemeContext";
import { mockService } from "../../services/mocks/mockService";
import { api } from "../../services/api";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

const ACTION_ICONS: Record<string, string> = {
  rfq_sent: "email-send-outline",
  quotation_submitted: "file-send-outline",
  po_generated: "file-document-outline",
  invoice_submitted: "receipt-text-outline",
  approval_approved: "check-circle-outline",
  approval_rejected: "close-circle-outline",
};

export const ActivityLogsScreen = () => {
  const { colors } = useTheme();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      if (USE_MOCKS) return mockService.getActivityLogs();
      const res = await api.get("/logs");
      return res.data.logs ?? res.data;
    },
  });

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={data}
      keyExtractor={(log: any) => log.log_id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      renderItem={({ item: log }: any) => (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
            <MaterialCommunityIcons
              name={(ACTION_ICONS[log.action] ?? "history") as any}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.entityRef, { color: colors.primary }]}>{log.entity_ref}</Text>
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {format(new Date(log.timestamp), "dd MMM, h:mm a")}
              </Text>
            </View>
            <Text style={[styles.description, { color: colors.text }]}>{log.description}</Text>
            <View style={styles.actorRow}>
              <MaterialCommunityIcons name="account-circle-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.actor, { color: colors.textMuted }]}>
                {log.performed_by} · {log.role?.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {isLoading ? "Loading logs..." : "No activity recorded yet."}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  entityRef: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  timestamp: { fontSize: 11 },
  description: { fontSize: 13, fontWeight: "600", lineHeight: 18, marginBottom: 6 },
  actorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  actor: { fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
