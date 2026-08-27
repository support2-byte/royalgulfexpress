import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface RecentOrder {
  rgl_booking_number: string;
  place_of_loading: string | number;
  place_of_destination: string | number;
  loading_place_name: string;
  destination_place_name: string;
  eta: string | null;
  status: string;
  created_at: string;
}

interface Props {
  order: RecentOrder;
  index: number;
}

export const RecentShipmentCard: React.FC<Props> = ({ order, index }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const etaLabel = order.eta
    ? `ETA: ${moment(order.eta).format("D MMM YYYY")}`
    : "ETA: —";

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(240 + index * 70)}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          router.navigate({
            pathname: "/shipment-details",
            params: { bookingNumber: order.rgl_booking_number },
          })
        }
      >
        <View style={styles.topRow}>
          <Text style={styles.bookingId}>
            {order.rgl_booking_number ?? "—"}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{order.status ?? "Unknown"}</Text>
          </View>
        </View>
        <Text style={styles.route}>{order.loading_place_name ?? "—"}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.route}>
            {order.destination_place_name ?? "—"}
          </Text>
          <Text style={styles.eta}>{etaLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.borderColor,
      marginBottom: 10,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    bookingId: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    statusText: {
      fontSize: fontSize.xs ?? 10,
      fontFamily: fonts.semiBold,
      color: colors.background,
    },
    route: {
      fontSize: fontSize.xs ?? fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    eta: {
      fontSize: fontSize.xs ?? 10,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
  });
