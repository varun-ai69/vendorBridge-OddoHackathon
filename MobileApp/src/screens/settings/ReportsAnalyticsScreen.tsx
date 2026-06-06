import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Dimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  VictoryChart,
  VictoryArea,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";

import { useTheme } from "../../theme/ThemeContext";
import { mockService } from "../../services/mocks/mockService";
import { api } from "../../services/api";

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48;

const fmt = (n: number) =>
  `₹${n >= 1_00_000 ? (n / 1_00_000).toFixed(1) + "L" : n.toLocaleString("en-IN")}`;

const TAB_OPTIONS = ["Spend Trend", "Vendor Performance"];

export const ReportsAnalyticsScreen = () => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: spendData,
    isRefetching: spendRefetching,
    refetch: refetchSpend,
  } = useQuery({
    queryKey: ["reports", "spend"],
    queryFn: async () => {
      if (USE_MOCKS) return mockService.getReportsSpendTrend();
      const res = await api.get("/reports/spend-trend");
      return res.data;
    },
  });

  const {
    data: vendorPerf = [],
    isRefetching: vendorRefetching,
    refetch: refetchVendor,
  } = useQuery({
    queryKey: ["reports", "vendor-performance"],
    queryFn: async () => {
      if (USE_MOCKS) return mockService.getReportsVendorPerformance();
      const res = await api.get("/reports/vendor-performance");
      return res.data;
    },
  });

  const isRefetching = spendRefetching || vendorRefetching;
  const refetch = () => { refetchSpend(); refetchVendor(); };

  // Chart data
  const spendTrend = (spendData?.monthly_trend ?? []).map((m: any) => ({
    x: m.month,
    y: m.total_spend / 1_00_000, // in Lakhs
    label: `₹${(m.total_spend / 1_00_000).toFixed(1)}L`,
  }));

  const vendorBars = vendorPerf.map((v: any) => ({
    x: v.vendor_name.split(" ")[0], // First word for brevity
    y: v.avg_rating,
    label: `${v.avg_rating}★`,
  }));

  const axisFontStyle = { fontSize: 10, fill: colors.textMuted, fontFamily: "System" };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Tab Switcher */}
      <View style={[styles.tabs, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
        {TAB_OPTIONS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, { color: activeTab === i ? "#fff" : colors.textMuted }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* === Spend Trend === */}
      {activeTab === 0 && (
        <>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Spend (₹ Lakhs)</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Total PO spend — {spendData?.year ?? "2026"}
            </Text>

            {spendTrend.length > 0 ? (
              <VictoryChart
                width={CHART_WIDTH}
                height={220}
                theme={VictoryTheme.material}
                padding={{ top: 20, bottom: 40, left: 48, right: 20 }}
                containerComponent={
                  <VictoryVoronoiContainer
                    labels={({ datum }: any) => datum.label}
                    labelComponent={<VictoryTooltip flyoutStyle={{ stroke: colors.primary }} />}
                  />
                }
              >
                <VictoryAxis
                  style={{ tickLabels: axisFontStyle, axis: { stroke: colors.surfaceBorder } }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t: number) => `₹${t}L`}
                  style={{ tickLabels: axisFontStyle, axis: { stroke: colors.surfaceBorder } }}
                />
                <VictoryArea
                  data={spendTrend}
                  style={{
                    data: {
                      fill: colors.primary + "40",
                      stroke: colors.primary,
                      strokeWidth: 2.5,
                    },
                  }}
                  animate={{ duration: 500, onLoad: { duration: 500 } }}
                />
              </VictoryChart>
            ) : (
              <View style={styles.noChart}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={40} color={colors.textMuted} />
                <Text style={[styles.noChartText, { color: colors.textMuted }]}>No spend data available</Text>
              </View>
            )}
          </View>

          {/* Spend Table */}
          {spendTrend.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Breakdown</Text>
              <View style={[styles.tableHeader, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.tableHCol, { color: colors.textMuted }]}>Month</Text>
                <Text style={[styles.tableHColR, { color: colors.textMuted }]}>Spend</Text>
                <Text style={[styles.tableHColR, { color: colors.textMuted }]}>POs</Text>
              </View>
              {(spendData?.monthly_trend ?? []).map((row: any) => (
                <View key={row.month} style={[styles.tableRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.tableCol, { color: colors.text }]}>{row.month}</Text>
                  <Text style={[styles.tableColR, { color: colors.primary }]}>{fmt(row.total_spend)}</Text>
                  <Text style={[styles.tableColR, { color: colors.textMuted }]}>{row.po_count}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* === Vendor Performance === */}
      {activeTab === 1 && (
        <>
          {vendorPerf.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Vendor Ratings</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>Average star rating per vendor</Text>

              <VictoryChart
                width={CHART_WIDTH}
                height={220}
                theme={VictoryTheme.material}
                domainPadding={{ x: 40 }}
                padding={{ top: 20, bottom: 50, left: 40, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    tickLabels: { ...axisFontStyle, angle: -15 },
                    axis: { stroke: colors.surfaceBorder },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  domain={[0, 5]}
                  style={{ tickLabels: axisFontStyle, axis: { stroke: colors.surfaceBorder } }}
                />
                <VictoryBar
                  data={vendorBars}
                  labels={({ datum }: any) => datum.label}
                  style={{
                    data: { fill: colors.secondary, borderRadius: 4 },
                    labels: { fontSize: 10, fill: colors.text, fontFamily: "System" },
                  }}
                  animate={{ duration: 500 }}
                />
              </VictoryChart>
            </View>
          )}

          {/* Vendor Performance Table */}
          {vendorPerf.map((vendor: any) => (
            <View key={vendor.vendor_id} style={[styles.vendorCard, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
              <View style={styles.vendorCardHeader}>
                <View style={[styles.vendorInitials, { backgroundColor: colors.secondary + "20" }]}>
                  <Text style={[styles.vendorInitialsText, { color: colors.secondary }]}>
                    {vendor.vendor_name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.vendorCardMeta}>
                  <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.vendor_name}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MaterialCommunityIcons
                        key={i}
                        name={i < Math.floor(vendor.avg_rating) ? "star" : "star-outline"}
                        size={14}
                        color={colors.accent}
                      />
                    ))}
                    <Text style={[styles.ratingNum, { color: colors.textMuted }]}>{vendor.avg_rating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.vendorStats}>
                {[
                  { l: "RFQs Received", v: String(vendor.total_rfqs_received), c: colors.info },
                  { l: "Bids Won", v: `${vendor.acceptance_rate.toFixed(0)}%`, c: colors.success },
                  { l: "On-Time", v: `${vendor.on_time_delivery_rate.toFixed(0)}%`, c: colors.primary },
                  { l: "Value Awarded", v: fmt(vendor.total_value_awarded), c: colors.accent },
                ].map(({ l, v, c }) => (
                  <View key={l} style={[styles.statChip, { backgroundColor: c + "14", borderColor: c + "40" }]}>
                    <Text style={[styles.statChipVal, { color: c }]}>{v}</Text>
                    <Text style={[styles.statChipLbl, { color: colors.textMuted }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  tabs: {
    flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 8 },
  noChart: { alignItems: "center", paddingVertical: 30, gap: 10 },
  noChartText: { fontSize: 13 },
  tableHeader: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1 },
  tableHCol: { flex: 1, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  tableHColR: { width: 80, textAlign: "right", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1 },
  tableCol: { flex: 1, fontSize: 13, fontWeight: "600" },
  tableColR: { width: 80, textAlign: "right", fontSize: 13, fontWeight: "700" },
  vendorCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  vendorCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  vendorInitials: { width: 46, height: 46, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  vendorInitialsText: { fontSize: 16, fontWeight: "900" },
  vendorCardMeta: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingNum: { fontSize: 12, marginLeft: 4 },
  vendorStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    alignItems: "center", minWidth: "46%",
  },
  statChipVal: { fontSize: 16, fontWeight: "900" },
  statChipLbl: { fontSize: 10, fontWeight: "600", marginTop: 2 },
});
