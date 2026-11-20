import { tr } from "@/i18n";
import { LAYOUT } from "@/constants/motion";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RecentOrder } from "@/types/home";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { LinearTransition } from "react-native-reanimated";
import { EmptyState } from "./EmptyState";
import { RecentShipmentCard } from "./RecentShipment";

interface Filter {
  key: string;
  label: string;
  statuses: string[] | null;
}

const FILTERS: Filter[] = [
  { key: "all", label: "All", statuses: null },
  {
    key: "processing",
    label: "Processing",
    statuses: [
      "Created",
      "Ready for Loading",
      "Loaded into Container",
      "Shipment Processing",
      "Under Processing",
    ],
  },
  {
    key: "transit",
    label: "In transit",
    statuses: ["Shipment In Transit", "Arrived at Sort Facility"],
  },
  {
    key: "delivered",
    label: "Delivered",
    statuses: ["Ready for Delivery", "Shipment Delivered"],
  },
  { key: "closed", label: "Closed", statuses: ["Rejected", "Cancelled"] },
];

interface Props {
  orders: RecentOrder[];
}

export const ShipmentsTab: React.FC<Props> = ({ orders }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    FILTERS.forEach((f) => {
      out[f.key] = f.statuses
        ? orders.filter((o) => f.statuses!.includes(o.status)).length
        : orders.length;
    });
    return out;
  }, [orders]);

  const visible = useMemo(() => {
    const group = FILTERS.find((f) => f.key === filter);
    if (!group?.statuses) return orders;
    return orders.filter((o) => group.statuses!.includes(o.status));
  }, [orders, filter]);

  return (
    <Animated.View layout={LAYOUT}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        {FILTERS.map((f) => {
          const on = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.8}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {f.label}
              </Text>
              <Text style={[styles.chipCount, on && styles.chipCountOn]}>
                {counts[f.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visible.length === 0 ? (
        <EmptyState
          icon="boat-outline"
          label={
            orders.length === 0
              ? "No shipments yet."
              : "No shipments in this category."
          }
        />
      ) : (
        visible.map((order, index) => (
          <RecentShipmentCard
            key={`${filter}-${order.rgl_booking_number}-${index}`}
            order={order}
            index={index}
          />
        ))
      )}
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    chipsScroll: {
      marginHorizontal: -20,
      marginBottom: 4,
    },
    chips: {
      paddingHorizontal: 20,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
    },
    chipOn: {
      backgroundColor: colors.ink,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    chipTextOn: {
      color: "#fff",
    },
    chipCount: {
      fontSize: fontSize.xs,
      fontFamily: fonts.semiBold,
      color: colors.lightText,
    },
    chipCountOn: {
      color: "rgba(255,255,255,0.65)",
    },
  });
