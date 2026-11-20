import { ls, tr } from "@/i18n";
import { api } from "@/api";
import Picker from "@/components/Tracking/Picker";
import Timeline, { TrackingStep } from "@/components/Tracking/Timeline";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { StateView } from "@/components/ui/StateView";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { itemLabel } from "@/lib/shipmentApi";
import {
  earliestEta,
  isPartial,
  journeySteps,
  normalizeShipments,
  type RawShipment,
} from "@/lib/tracking";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface StatusHistoryEntry {
  tracking_id: number;
  old_status: string | null;
  status: string;
  time: string;
  eta: string | null;
  etd: string | null;
  created_by: string;
  consignment_number: string | null;
}

interface ReceiverItem {
  item_id: number;
  item_ref: string;
  tracking_id: string;
  total_number: number;
  weight: number;
  shipments?: RawShipment[];
}

interface ReceiverTracking {
  receiver_id: number;
  status: string;
  eta: string | null;
  items: ReceiverItem[];
  current_status: string;
  status_history: StatusHistoryEntry[];
  remaining_status_steps: string[];
  latest_tracking_status: string;
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

interface OrderItemOption {
  order_item_id: number;
  tracking_id: string | null;
  label: string;
}

interface OrderOption {
  order_id: number;
  booking_number: string;
  items: OrderItemOption[];
}

const TERMINAL_STATUSES = ["Rejected", "Cancelled"];

const STATUS_CHIP: Record<
  string,
  { bg: string; colorKey: "secondary" | "primary" | "lightPrimary" | "error" }
> = {
  "Ready for Delivery": { bg: "#F0FDF4", colorKey: "lightPrimary" },
  "Shipment Delivered": { bg: "#ECFDF5", colorKey: "primary" },
  Rejected: { bg: "#FEF2F2", colorKey: "error" },
  Cancelled: { bg: "#FEF2F2", colorKey: "error" },
};

export default function DeliveryScreen() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const params = useLocalSearchParams<{
    orderId?: string;
    itemTrackingId?: string;
  }>();
  const { orders } = useAppContext();

  const orderOptions: OrderOption[] = useMemo(
    () =>
      orders.map((o) => ({
        order_id: o.order_id,
        booking_number: o.booking_number,
        items: o.items.map((i) => ({
          order_item_id: i.order_item_id,
          tracking_id: i.tracking_id,
          label: itemLabel(i),
        })),
      })),
    [orders],
  );

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    params.orderId ? Number(params.orderId) : null,
  );
  const [selectedItem, setSelectedItem] = useState<OrderItemOption | null>(
    null,
  );
  const [tracking, setTracking] = useState<TrackingApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrder = orderOptions.find(
    (o) => o.order_id === selectedOrderId,
  );

  useEffect(() => {
    setSelectedItem(null);
    setTracking(null);
    setError(null);
  }, [selectedOrderId]);

  // Deep link from the home search: open straight on the searched item.
  useEffect(() => {
    if (!params.itemTrackingId || !selectedOrder || selectedItem) return;
    const match = selectedOrder.items.find(
      (i) =>
        (i.tracking_id ?? "").toLowerCase() ===
        params.itemTrackingId!.toLowerCase(),
    );
    if (match) setSelectedItem(match);
  }, [params.itemTrackingId, selectedOrder, selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    if (!selectedItem.tracking_id) {
      setTracking(null);
      setError("Tracking is not available for this item");
      return;
    }

    let cancelled = false;

    const fetchTracking = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(
          `shipments/track/item/${encodeURIComponent(selectedItem.tracking_id!)}`,
        );
        if (cancelled) return;
        setTracking(res.data?.data as TrackingApiData);
      } catch {
        if (!cancelled) setError("Unable to load tracking for this item");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTracking();

    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  const receiver = tracking?.receivers?.[0];
  const receiverItem = receiver?.items?.[0];

  // Partial assignment: one item split across several containers.
  const journey = useMemo(
    () => journeySteps(tracking?.status_sequence),
    [tracking?.status_sequence],
  );
  const parts = useMemo(
    () => normalizeShipments(receiverItem, journey),
    [receiverItem, journey],
  );
  const partial = isPartial(parts);

  const trackingSteps: TrackingStep[] = useMemo(() => {
    if (!receiver) return [];

    const historyAsc = [...receiver.status_history].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );

    const completed: TrackingStep[] = historyAsc.map((h) => ({
      title: h.status,
      date: h.time,
      status: "completed",
    }));

    if (completed.length > 0) {
      completed[completed.length - 1].status = "active";
    }

    const isTerminal = TERMINAL_STATUSES.includes(receiver.current_status);
    const doneTitles = new Set(completed.map((c) => c.title));

    const pending: TrackingStep[] = receiver.remaining_status_steps
      .filter((s) => !doneTitles.has(s))
      .filter((s) =>
        TERMINAL_STATUSES.includes(s)
          ? isTerminal && s === receiver.current_status
          : true,
      )
      .map((s) => ({ title: s, date: null, status: "pending" as const }));

    return [...completed, ...pending];
  }, [receiver]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Tracking"
        description={tr("Follow your cargo from origin to doorstep")}
        icon="navigate"
      />

      <View style={sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
        >
          <Picker
            orderOptions={orderOptions}
            selectedOrder={selectedOrder}
            selectedItemLabel={selectedItem?.label ?? null}
            onSelectOrder={(o) => setSelectedOrderId(o.order_id)}
            onSelectItem={(i) => setSelectedItem(i)}
            styles={styles}
          />

          {loading && (
            <View style={styles.stateBox}>
              <StateView loading />
            </View>
          )}

          {!loading && error && (
            <View style={styles.stateBox}>
              <StateView icon="cloud-offline-outline" label={error} />
            </View>
          )}

          {!loading && !error && tracking && receiver && (
            <>
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.summary}
              >
                <Text style={styles.summaryLabel}>{tr("Booking number")}</Text>
                <Text style={styles.trackingNumber}>
                  {tracking.rgl_booking_number}
                </Text>
                {!!tracking.booking_ref && (
                  <Text style={styles.summarySub}>{tracking.booking_ref}</Text>
                )}

                <View style={styles.route}>
                  <View style={styles.routeRail}>
                    <View
                      style={[styles.node, { backgroundColor: colors.primary }]}
                    />
                    <View style={styles.nodeLine} />
                    <View
                      style={[
                        styles.node,
                        { backgroundColor: colors.secondary },
                      ]}
                    />
                  </View>
                  <View style={styles.routeTexts}>
                    <View>
                      <Text style={styles.routeLabel}>{tr("Origin")}</Text>
                      <Text style={styles.routeValue} numberOfLines={2}>
                        {tracking.place_of_loading}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.routeLabel}>{tr("Destination")}</Text>
                      <Text style={styles.routeValue} numberOfLines={2}>
                        {tracking.place_of_delivery}
                      </Text>
                    </View>
                  </View>
                </View>

                {receiverItem && (
                  <View style={styles.itemStatsRow}>
                    <View style={styles.itemStat}>
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.itemStatText} numberOfLines={1}>
                        {receiverItem.tracking_id}
                      </Text>
                    </View>
                    <View style={styles.itemStat}>
                      <Ionicons
                        name="cube-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.itemStatText}>
                        {receiverItem.total_number} boxes
                      </Text>
                    </View>
                    <View style={styles.itemStat}>
                      <Ionicons
                        name="scale-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.itemStatText}>
                        {receiverItem.weight} kg
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>

              <Timeline
                steps={trackingSteps}
                eta={(partial ? earliestEta(parts) : null) || receiver.eta}
                styles={styles}
                partial={partial ? { parts, steps: journey } : null}
              />
            </>
          )}

          {!loading && !error && !tracking && (
            <View style={styles.stateBox}>
              <StateView
                icon="search-outline"
                label={
                  selectedOrder
                    ? "Select an item to view tracking"
                    : "Select an order to get started"
                }
              />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    bodyContainer: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 40,
    },
    stateBox: {
      minHeight: 260,
    },
    pickerRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 24,
    },
    pickerField: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: colors.surface,
    },
    pickerFieldDisabled: {
      opacity: 0.5,
    },
    pickerLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: 3,
    },
    pickerValueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    pickerValue: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    summary: {
      paddingBottom: 22,
      marginBottom: 22,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    summaryLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    trackingNumber: {
      fontFamily: fonts.bold,
      fontSize: 28,
      lineHeight: 34,
      color: colors.ink,
      letterSpacing: ls(-0.7),
      marginTop: 2,
    },
    summarySub: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      marginTop: 2,
    },
    route: {
      flexDirection: "row",
      gap: 14,
      marginTop: 22,
    },
    routeRail: {
      alignItems: "center",
      paddingVertical: 5,
    },
    node: { width: 10, height: 10, borderRadius: 5 },
    nodeLine: {
      flex: 1,
      width: 1.5,
      backgroundColor: colors.borderColor,
      marginVertical: 4,
    },
    routeTexts: { flex: 1, gap: 16 },
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
      flexWrap: "wrap",
      columnGap: 18,
      rowGap: 6,
      marginTop: 20,
    },
    itemStat: { flexDirection: "row", alignItems: "center", gap: 6 },
    itemStatText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(14,27,26,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      maxHeight: "65%",
    },
    modalHandle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.dome,
      marginBottom: 18,
    },
    modalTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSize.lg,
      color: colors.ink,
      marginBottom: 8,
    },
    modalSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
    },
    modalRowText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 20,
    },
  });
