import { flipIcon, tr } from "@/i18n";
import { DefaultStatusStyle, ShipmentStatus } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RecentOrder } from "@/types/home";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Props {
  order: RecentOrder;
  index: number;
}

export const RecentShipmentCard: React.FC<Props> = ({ order, index }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const tone: { bg: string; text: string; dot: string } =
    (ShipmentStatus as Record<string, { bg: string; text: string; dot: string }>)[
      order.status
    ] ?? DefaultStatusStyle;

  const etaLabel = order.eta ? moment(order.eta).format("D MMM YYYY") : "—";

  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 45)}
    >
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.6}
        onPress={() =>
          router.navigate({
            pathname: "/shipment-details",
            params: { bookingNumber: order.rgl_booking_number },
          })
        }
      >
        <View style={styles.rail}>
          <View style={[styles.railDot, { backgroundColor: tone.dot }]} />
        </View>

        <View style={styles.main}>
          <Text style={styles.bookingId} numberOfLines={1}>
            {order.rgl_booking_number ?? "—"}
          </Text>
          <View style={styles.routeRow}>
            <Text style={styles.route} numberOfLines={1}>
              {order.loading_place_name ?? "—"}
            </Text>
            <Ionicons
              name={flipIcon("arrow-forward") as any}
              size={12}
              color={colors.lightText}
            />
            <Text style={styles.route} numberOfLines={1}>
              {order.destination_place_name ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.side}>
          <Text style={[styles.status, { color: tone.text }]} numberOfLines={1}>
            {order.status ?? "Unknown"}
          </Text>
          <Text style={styles.eta}>ETA {etaLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      gap: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    rail: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    railDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    main: {
      flex: 1,
    },
    bookingId: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 3,
    },
    route: {
      flexShrink: 1,
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    side: {
      alignItems: "flex-end",
      maxWidth: "38%",
    },
    status: {
      fontSize: fontSize.xs,
      fontFamily: fonts.semiBold,
    },
    eta: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.lightText,
      marginTop: 3,
    },
  });
