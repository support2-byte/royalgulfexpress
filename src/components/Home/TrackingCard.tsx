import { LAYOUT } from "@/constants/motion";
import { api } from "@/api";
import TrackingHistory from "@/components/Home/TrackingHistory";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import PartialShipments from "@/components/Tracking/PartialShipments";
import { ShipmentStatus, DefaultStatusStyle } from "@/constants/theme";
import { flipIcon, tr, ls, useI18n } from "@/i18n";
import {
  isPartial,
  journeySteps,
  normalizeShipments,
  type RawShipment,
} from "@/lib/tracking";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Tab = "tracking" | "storage";

interface ReceiverItem {
  item_id: number;
  item_ref: string;
  tracking_id?: string;
  total_number: number;
  weight: number;
  shipments?: RawShipment[];
}

interface OrderTrackingItem {
  id: number;
  trackingId: string | null;
  category: string | null;
  subcategory: string | null;
  totalNumber: number | string | null;
  status: string | null;
  shipments?: RawShipment[];
}

interface OrderTrackingData {
  order_id: number;
  tracking_id: string | null;
  rgl_booking_number: string;
  receivers: { id: number; receiverName: string | null; shippingDetails: OrderTrackingItem[] }[];
}

interface ReceiverTracking {
  receiver_id: number;
  status: string;
  eta: string | null;
  items: ReceiverItem[];
  current_status: string;
  latest_tracking_status: string;
  status_history?: { status: string; time: string }[];
  remaining_status_steps?: string[];
}

interface TrackingApiData {
  order_id: number;
  booking_ref: string;
  rgl_booking_number: string;
  place_of_loading: string;
  place_of_delivery: string;
  status_sequence?: string[];
  receivers: ReceiverTracking[];
}

const TrackingHomeCard = () => {
  const { orders } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const [tab, setTab] = useState<Tab>("tracking");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useI18n();
  // Messages that embed the reference are translated when set, so drop them on a language change.
  useEffect(() => {
    setError(null);
  }, [lang]);

  const [trackingData, setTrackingData] = useState<TrackingApiData | null>(
    null,
  );
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [segWidth, setSegWidth] = useState(0);
  const thumbX = useSharedValue(0);

  useEffect(() => {
    thumbX.value = withSpring(tab === "tracking" ? 0 : segWidth / 2, {
      damping: 18,
      stiffness: 220,
    });
  }, [tab, segWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setTrackingData(null);
    setOrderData(null);
  };

  const firstOf = (data: any) => (Array.isArray(data) ? data[0] : data);

  // Accepts an Item Tracking ID or an Order Tracking ID.
  const handleTrackingSearch = async (ref: string) => {
    try {
      const res = await api.get(
        `shipments/track/item/${encodeURIComponent(ref)}`,
      );
      const data = firstOf(res?.data?.data);
      if (data?.order_id) {
        setTrackingData(data as TrackingApiData);
        return;
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) throw err;
    }

    const res = await api.get(
      `shipments/track/order/${encodeURIComponent(ref)}`,
    );
    const data = firstOf(res?.data?.data);

    if (!data?.order_id) {
      setError(tr('No shipment found for "{ref}"', { ref }));
      return;
    }

    setOrderData(data as OrderTrackingData);
  };

  const openOrderItem = async (trackingId: string | null) => {
    if (!trackingId) return;
    setQuery(trackingId);
    setOrderData(null);
    setLoading(true);
    setError(null);
    try {
      await handleTrackingSearch(trackingId);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStorageSearch = (ref: string) => {
    const matchedOrder = orders.find(
      (o) => o.booking_number.toLowerCase() === ref.trim().toLowerCase(),
    );

    if (!matchedOrder) {
      setError(tr('No shipment found for "{ref}"', { ref }));
      return;
    }

    const bookingNumber =
      (matchedOrder as any).rgl_booking_number ?? matchedOrder.booking_number;

    router.navigate({
      pathname: "/purchase-storage",
      params: { bookingNumber },
    });
  };

  const handleSubmit = async () => {
    const ref = query.trim();
    if (!ref) return;

    Keyboard.dismiss();
    setError(null);
    setLoading(true);
    setTrackingData(null);
    setOrderData(null);

    try {
      if (tab === "tracking") {
        await handleTrackingSearch(ref);
      } else {
        handleStorageSearch(ref);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? tr('No shipment found for "{ref}"', { ref })
          : err?.response?.data?.message || tr("Something went wrong. Try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const receiver = trackingData?.receivers?.[0];
  const receiverItem = receiver?.items?.[0];

  const journey = useMemo(
    () => journeySteps(trackingData?.status_sequence),
    [trackingData?.status_sequence],
  );
  const parts = useMemo(
    () => normalizeShipments(receiverItem, journey),
    [receiverItem, journey],
  );
  const partial = isPartial(parts);

  return (
    <Animated.View
      layout={LAYOUT}
      style={styles.wrapper}
    >
      {/* <View
        style={styles.segment}
        onLayout={(e) => setSegWidth(e.nativeEvent.layout.width - 8)}
      >
        <Animated.View
          style={[styles.segmentThumb, { width: segWidth / 2 }, thumbStyle]}
        />
        <TouchableOpacity
          style={styles.segmentItem}
          activeOpacity={0.8}
          onPress={() => switchTab("tracking")}
        >
          <Ionicons
            name="navigate-outline"
            size={15}
            color={tab === "tracking" ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              tab === "tracking" && styles.segmentTextActive,
            ]}
          >
            {tr("Track")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.segmentItem}
          activeOpacity={0.8}
          onPress={() => switchTab("storage")}
        >
          <Ionicons
            name="cube-outline"
            size={15}
            color={tab === "storage" ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              tab === "storage" && styles.segmentTextActive,
            ]}
          >
            {tr("Storage")}
          </Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.lightText} />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            if (error) setError(null);
            if (trackingData) setTrackingData(null);
            if (orderData) setOrderData(null);
          }}
          placeholder={
            tab === "tracking" ? tr("Item or order tracking ID") : tr("Booking number, e.g. TEST4106")
          }
          placeholderTextColor={colors.lightText}
          style={styles.input}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.actionButton,
            !query.trim() && !loading && styles.actionButtonIdle,
          ]}
          activeOpacity={0.85}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={flipIcon("arrow-forward") as any} size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOutUp.duration(250)}
          style={styles.errorRow}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#B4690E" />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {orderData && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOutUp.duration(250)}
          layout={LAYOUT}
          style={styles.result}
        >
          <Text style={styles.summaryLabel}>{tr("Order tracking ID")}</Text>
          <Text style={styles.trackingNumber} numberOfLines={1}>
            {orderData.tracking_id ?? orderData.rgl_booking_number}
          </Text>
          <Text style={[styles.summaryLabel, { marginTop: 4, marginBottom: 6 }]}>
            {tr("Select an item to see where it is.")}
          </Text>
          {orderData.receivers.flatMap((r) => r.shippingDetails).map((it) => {
            const tone =
              (ShipmentStatus as Record<string, { text: string; dot: string }>)[
                it.status ?? ""
              ] ?? DefaultStatusStyle;
            const label =
              [it.category, it.subcategory].filter(Boolean).join(" · ") ||
              tr("Item");
            const nParts = it.shipments?.length ?? 0;
            return (
              <TouchableOpacity
                key={it.id}
                style={styles.orderItemRow}
                activeOpacity={0.6}
                onPress={() => openOrderItem(it.trackingId)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderItemId} numberOfLines={1}>
                    {it.trackingId ?? "—"}
                  </Text>
                  <Text style={styles.orderItemMeta} numberOfLines={1}>
                    {label}
                    {nParts > 1 ? `  ·  ${tr("{n} shipments", { n: nParts })}` : ""}
                  </Text>
                </View>
                <View style={styles.orderItemStatus}>
                  <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
                  <Text
                    style={[styles.statusChipText, { color: tone.text }]}
                    numberOfLines={1}
                  >
                    {tr(it.status ?? "Created")}
                  </Text>
                </View>
                <Ionicons
                  name={flipIcon("chevron-forward") as any}
                  size={16}
                  color={colors.lightText}
                />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {trackingData && receiver && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOutUp.duration(250)}
          layout={LAYOUT}
          style={styles.result}
        >
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{tr("Booking number")}</Text>
              <Text style={styles.trackingNumber} numberOfLines={1}>
                {trackingData.rgl_booking_number}
              </Text>
            </View>
            <View style={styles.statusChip}>
              <View style={styles.statusDot} />
              <Text style={styles.statusChipText} numberOfLines={1}>
                {partial
                  ? tr("{n} shipments", { n: parts.length })
                  : tr(receiver.current_status)}
              </Text>
            </View>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineRail}>
              <View
                style={[styles.node, { backgroundColor: colors.primary }]}
              />
              <View style={styles.nodeLine} />
              <View
                style={[styles.node, { backgroundColor: colors.secondary }]}
              />
            </View>
            <View style={styles.timelineText}>
              <View>
                <Text style={styles.routeLabel}>{tr("From")}</Text>
                <Text style={styles.routeValue} numberOfLines={2}>
                  {trackingData.place_of_loading}
                </Text>
              </View>
              <View>
                <Text style={styles.routeLabel}>{tr("To")}</Text>
                <Text style={styles.routeValue} numberOfLines={2}>
                  {trackingData.place_of_delivery}
                </Text>
              </View>
            </View>
          </View>

          {receiverItem && (
            <View style={styles.itemStatsRow}>
              <View style={styles.itemStat}>
                <Ionicons
                  name="cube-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={styles.itemStatText}>
                  {receiverItem.total_number} boxes
                </Text>
              </View>
              <View style={styles.itemStat}>
                <Ionicons
                  name="scale-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={styles.itemStatText}>
                  {receiverItem.weight} kg
                </Text>
              </View>
            </View>
          )}

          {partial ? (
            <PartialShipments parts={parts} steps={journey} />
          ) : (
            <TrackingHistory
              history={receiver.status_history ?? []}
              remaining={receiver.remaining_status_steps ?? []}
              current={receiver.current_status}
            />
          )}

          <TouchableOpacity
            style={styles.fullDetailsButton}
            activeOpacity={0.85}
            onPress={() =>
              router.navigate({
                pathname: "/tracking",
                params: {
                  orderId: String(trackingData.order_id),
                  itemTrackingId: receiverItem?.tracking_id ?? query.trim(),
                },
              })
            }
          >
            <Text style={styles.fullDetailsText}>{tr("Open tracking page")}</Text>
            <Ionicons name={flipIcon("arrow-forward") as any} size={16} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
    },
    segment: {
      flexDirection: "row",
      alignSelf: "flex-start",
      width: 210,
      height: 40,
      padding: 4,
      borderRadius: 20,
      backgroundColor: colors.dome,
      marginBottom: 14,
    },
    segmentThumb: {
      position: "absolute",
      top: 4,
      left: 4,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#fff",
      shadowColor: colors.primaryDeep,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 2,
    },
    segmentItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    segmentText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.ink,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 58,
      backgroundColor: "#fff",
      borderRadius: 29,
      paddingLeft: 20,
      paddingRight: 7,
      shadowColor: colors.primaryDeep,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    input: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.ink,
      paddingVertical: 0,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
    },
    actionButtonIdle: {
      backgroundColor: colors.dome,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingHorizontal: 4,
    },
    errorText: {
      flex: 1,
      fontSize: fontSize.xs,
      fontFamily: fonts.medium,
      color: "#B4690E",
    },
    result: {
      marginTop: 20,
      paddingTop: 18,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderColor,
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },
    summaryLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    trackingNumber: {
      fontFamily: fonts.bold,
      fontSize: fontSize.lg,
      color: colors.ink,
      letterSpacing: ls(-0.2),
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#fff",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      maxWidth: "48%",
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    statusChipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs,
      color: colors.ink,
      flexShrink: 1,
    },
    timeline: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 16,
    },
    timelineRail: {
      alignItems: "center",
      paddingVertical: 5,
    },
    node: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    nodeLine: {
      flex: 1,
      width: 1.5,
      backgroundColor: colors.borderColor,
      marginVertical: 4,
    },
    timelineText: {
      flex: 1,
      gap: 14,
    },
    routeLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: 1,
    },
    routeValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    itemStatsRow: {
      flexDirection: "row",
      gap: 18,
      marginBottom: 18,
    },
    itemStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    itemStatText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    orderItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    orderItemId: {
      fontFamily: fonts.bold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    orderItemMeta: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    orderItemStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: "40%",
    },
    fullDetailsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    fullDetailsText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.primary,
    },
  });

export default TrackingHomeCard;
