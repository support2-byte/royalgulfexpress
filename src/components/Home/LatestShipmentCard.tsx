import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import moment from "moment";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LatestOrder {
  rgl_booking_number: string;
  loading_place_name: string;
  destination_place_name: string;
  eta: string | null;
  status: string;
  item_ref?: string;
}

const STAGE_META: Record<string, { progress: number; stage: string }> = {
  Created: { progress: 0.08, stage: "Booked" },
  "Ready for Loading": { progress: 0.25, stage: "Preparing for loading" },
  "Loaded into Container": {
    progress: 0.4,
    stage: "Loaded, awaiting departure",
  },
  "Shipment Processing": { progress: 0.5, stage: "Processing at origin" },
  "Shipment In Transit": { progress: 0.65, stage: "On the move" },
  "Under Processing": { progress: 0.75, stage: "Customs / port processing" },
  "Arrived at Sort Facility": { progress: 0.85, stage: "Arrived, sorting" },
  "Ready for Delivery": { progress: 0.95, stage: "Out for delivery" },
  "Shipment Delivered": { progress: 1, stage: "Delivered" },
  Rejected: { progress: 1, stage: "Rejected" },
  Cancelled: { progress: 1, stage: "Cancelled" },
};

const LatestShipmentCard = ({ order }: { order: LatestOrder }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const [copiedBooking, setCopiedBooking] = useState(false);
  const [copiedItemRef, setCopiedItemRef] = useState(false);

  const handleCopyBooking = async (e: any) => {
    e.stopPropagation?.();
    await Clipboard.setStringAsync(order.rgl_booking_number);
    setCopiedBooking(true);
    setTimeout(() => setCopiedBooking(false), 1500);
  };

  const handleCopyItemRef = async (e: any) => {
    e.stopPropagation?.();
    if (!order.item_ref) return;
    await Clipboard.setStringAsync(order.item_ref);
    setCopiedItemRef(true);
    setTimeout(() => setCopiedItemRef(false), 1500);
  };

  const meta = STAGE_META[order.status] ?? {
    progress: 0.1,
    stage: order.status,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.navigate({
          pathname: "/shipment-details",
          params: { bookingNumber: order.rgl_booking_number },
        })
      }
    >
      <LinearGradient
        style={styles.card}
        colors={[colors.primary, "#043a37"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topRow}>
          <Text style={styles.label}>LATEST SHIPMENT</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{order.status}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookingIdRow}
          onPress={handleCopyBooking}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={styles.bookingId}>{order.rgl_booking_number}</Text>
          <Ionicons
            name={copiedBooking ? "checkmark" : "copy-outline"}
            size={16}
            color={colors.secondary}
          />
        </TouchableOpacity>

        {order.item_ref && (
          <TouchableOpacity
            style={styles.itemRefRow}
            onPress={handleCopyItemRef}
            hitSlop={8}
            activeOpacity={0.6}
          >
            <Text style={styles.itemRefText} numberOfLines={1}>
              {order.item_ref}
            </Text>
            <Ionicons
              name={copiedItemRef ? "checkmark" : "copy-outline"}
              size={13}
              color={colors.secondary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotOrigin]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {order.loading_place_name}
            </Text>
          </View>
          <View style={styles.dotLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotDestination]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {order.destination_place_name}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(meta.progress * 100)}%` },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerStage} numberOfLines={1}>
            {meta.stage}
          </Text>
          <Text style={styles.footerEta}>
            {order.eta
              ? `ETA ${moment(order.eta).format("D MMM YYYY")}`
              : "ETA —"}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    card: {
      borderRadius: 22,
      padding: 20,
      marginTop: 16,
      marginBottom: 8,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    label: {
      fontSize: fontSize.xs ?? 11,
      color: colors.background,
      fontFamily: fonts.semiBold,
      opacity: 0.7,
      letterSpacing: 0.5,
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    statusPillText: {
      fontSize: fontSize.xs ?? 11,
      color: "#fff",
      fontFamily: fonts.semiBold,
    },
    bookingId: {
      fontSize: fontSize.xl,
      color: colors.secondary,
      fontFamily: fonts.bold,
    },
    bookingIdRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
      alignSelf: "flex-start",
    },
    itemRefRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    itemRefText: {
      fontSize: fontSize.xs ?? 11,
      color: colors.background,
      fontFamily: fonts.medium ?? fonts.regular,
      opacity: 0.85,
    },
    routeBlock: {
      marginBottom: 14,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotOrigin: {
      backgroundColor: "#fff",
    },
    dotDestination: {
      backgroundColor: colors.secondary,
    },
    dotLine: {
      width: 1,
      height: 16,
      backgroundColor: "rgba(255,255,255,0.35)",
      marginLeft: 3.5,
    },
    routeText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.background,
      fontFamily: fonts.medium ?? fonts.regular,
      opacity: 0.95,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.25)",
      overflow: "hidden",
      marginBottom: 14,
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: colors.secondary,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerStage: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.background,
      fontFamily: fonts.semiBold,
      marginRight: 8,
    },
    footerEta: {
      fontSize: fontSize.sm,
      color: colors.background,
      fontFamily: fonts.semiBold,
    },
  });

export default LatestShipmentCard;
