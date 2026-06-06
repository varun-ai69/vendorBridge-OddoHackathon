import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonBox = ({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonBoxProps) => {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, backgroundColor: colors.surfaceBorder, opacity },
        style,
      ]}
    />
  );
};

/** Card-shaped skeleton for list items */
export const SkeletonCard = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder }]}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={44} height={44} borderRadius={10} />
        <View style={styles.cardMeta}>
          <SkeletonBox width="60%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={12} borderRadius={6} />
        </View>
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
      <SkeletonBox height={1} borderRadius={0} style={{ marginVertical: 10 }} />
      <View style={styles.cardFooter}>
        <SkeletonBox width="30%" height={12} borderRadius={6} />
        <SkeletonBox width="30%" height={12} borderRadius={6} />
        <SkeletonBox width="25%" height={12} borderRadius={6} />
      </View>
    </View>
  );
};

/** Full-page skeleton for list screens */
export const SkeletonListScreen = ({ count = 5 }: { count?: number }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {},
  card: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMeta: { flex: 1 },
  cardFooter: { flexDirection: "row", gap: 14 },
  listContainer: { padding: 16, gap: 4 },
});
