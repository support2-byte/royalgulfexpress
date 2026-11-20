import { ls, tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface LatestOrder {
  rgl_booking_number: string;
  loading_place_name: string;
  destination_place_name: string;
  eta: string | null;
  status: string;
  item_tracking_id?: string;
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
  const [trackWidth, setTrackWidth] = useState(0);

  const meta = STAGE_META[order.status] ?? {
    progress: 0.1,
    stage: order.status,
  };
  const inFlight = meta.progress < 1;

  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      250,
      withTiming(meta.progress, {
        duration: 1100,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [meta.progress, order.rgl_booking_number]);

  useEffect(() => {
    if (!inFlight) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, [inFlight]);

  const fillStyle = useAnimatedStyle(() => ({
    width: progress.value * trackWidth,
  }));

  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * trackWidth - 7 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.8 }],
  }));

  const handleCopyBooking = async (e: any) => {
    e.stopPropagation?.();
    await Clipboard.setStringAsync(order.rgl_booking_number);
    setCopiedBooking(true);
    setTimeout(() => setCopiedBooking(false), 1500);
  };

  const handleCopyItemRef = async (e: any) => {
    e.stopPropagation?.();
    if (!order.item_tracking_id) return;
    await Clipboard.setStringAsync(order.item_tracking_id);
    setCopiedItemRef(true);
    setTimeout(() => setCopiedItemRef(false), 1500);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() =>
        router.navigate({
          pathname: "/shipment-details",
          params: { bookingNumber: order.rgl_booking_number },
        })
      }
    >
      <LinearGradient
        style={styles.card}
        colors={[colors.primary, colors.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topRow}>
          <Text style={styles.label}>{tr("Latest shipment")}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText} numberOfLines={1}>
              {order.status}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.copyRow}
          onPress={handleCopyBooking}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={styles.bookingId} numberOfLines={1}>
            {order.rgl_booking_number}
          </Text>
          <Ionicons
            name={copiedBooking ? "checkmark" : "copy-outline"}
            size={16}
            color="rgba(255,255,255,0.8)"
          />
        </TouchableOpacity>

        {order.item_tracking_id && (
          <TouchableOpacity
            style={styles.copyRow}
            onPress={handleCopyItemRef}
            hitSlop={8}
            activeOpacity={0.6}
          >
            <Text style={styles.itemRefText} numberOfLines={1}>
              {order.item_tracking_id}
            </Text>
            <Ionicons
              name={copiedItemRef ? "checkmark" : "copy-outline"}
              size={13}
              color="rgba(255,255,255,0.7)"
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

        <View
          style={styles.progressWrap}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, fillStyle]} />
          </View>
          <Animated.View style={[styles.head, headStyle]}>
            {inFlight && <Animated.View style={[styles.halo, haloStyle]} />}
            <View style={styles.headCore} />
          </Animated.View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerStage} numberOfLines={1}>
            {meta.stage}
          </Text>
          <Text style={styles.footerEta}>
            {order.eta
              ? `${tr("ETA")} ${moment(order.eta).format("D MMM YYYY")}`
              : "ETA —"}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    card: {
      borderRadius: 28,
      padding: 22,
      overflow: "hidden",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      gap: 10,
    },
    label: {
      fontSize: fontSize.sm,
      color: "rgba(255,255,255,0.72)",
      fontFamily: fonts.medium,
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      maxWidth: "60%",
    },
    statusPillText: {
      fontSize: fontSize.xs,
      color: "#fff",
      fontFamily: fonts.semiBold,
    },
    copyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    bookingId: {
      fontSize: fontSize.xxl,
      color: "#fff",
      fontFamily: fonts.bold,
      letterSpacing: ls(-0.4),
    },
    itemRefText: {
      fontSize: fontSize.xs,
      color: "rgba(255,255,255,0.75)",
      fontFamily: fonts.medium,
      maxWidth: 260,
    },
    routeBlock: {
      marginTop: 18,
      marginBottom: 22,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    dotOrigin: {
      backgroundColor: "#fff",
    },
    dotDestination: {
      backgroundColor: colors.secondary,
    },
    dotLine: {
      width: 1,
      height: 18,
      backgroundColor: "rgba(255,255,255,0.35)",
      marginLeft: 4,
    },
    routeText: {
      flex: 1,
      fontSize: fontSize.md,
      color: "#fff",
      fontFamily: fonts.medium,
    },
    progressWrap: {
      height: 14,
      justifyContent: "center",
      marginBottom: 14,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.22)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: colors.secondary,
    },
    head: {
      position: "absolute",
      left: 0,
      width: 14,
      height: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    halo: {
      position: "absolute",
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.secondary,
    },
    headCore: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#fff",
      borderWidth: 3,
      borderColor: colors.secondary,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerStage: {
      flex: 1,
      fontSize: fontSize.sm,
      color: "#fff",
      fontFamily: fonts.semiBold,
      marginRight: 8,
    },
    footerEta: {
      fontSize: fontSize.sm,
      color: "rgba(255,255,255,0.85)",
      fontFamily: fonts.medium,
    },
  });

export default LatestShipmentCard;
