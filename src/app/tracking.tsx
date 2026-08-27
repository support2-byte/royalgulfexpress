import { api } from "@/api";
import Picker from "@/components/Tracking/Picker";
import Timeline, { TrackingStep } from "@/components/Tracking/Timeline";
import Header from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  total_number: number;
  weight: number;
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
  receivers: ReceiverTracking[];
}

interface OrderItemOption {
  order_item_id: number;
  item_ref: string;
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
  const params = useLocalSearchParams<{ orderId?: string }>();
  const { orders } = useAppContext();

  const orderOptions: OrderOption[] = useMemo(
    () =>
      orders.map((o) => ({
        order_id: o.order_id,
        booking_number: o.booking_number,
        items: o.items.map((i) => ({
          order_item_id: i.order_item_id,
          item_ref: i.item_ref,
        })),
      })),
    [orders],
  );

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    params.orderId ? Number(params.orderId) : null,
  );
  const [selectedItemRef, setSelectedItemRef] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrder = orderOptions.find(
    (o) => o.order_id === selectedOrderId,
  );

  useEffect(() => {
    setSelectedItemRef(null);
    setTracking(null);
  }, [selectedOrderId]);

  useEffect(() => {
    if (!selectedItemRef) return;

    let cancelled = false;

    const fetchTracking = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(
          `shipments/track/item/${encodeURIComponent(selectedItemRef)}`,
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
  }, [selectedItemRef]);

  const receiver = tracking?.receivers?.[0];
  const receiverItem = receiver?.items?.[0];

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

  const chip = receiver ? STATUS_CHIP[receiver.current_status] : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <Header name="Tracking" description="Track your shipment" icon="boat" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContainer}
      >
        <Picker
          orderOptions={orderOptions}
          selectedOrder={selectedOrder}
          selectedItemRef={selectedItemRef}
          onSelectOrder={(o) => setSelectedOrderId(o.order_id)}
          onSelectItem={(i) => setSelectedItemRef(i.item_ref)}
          styles={styles}
        />

        {loading && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerBlock}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={colors.error ?? "#B91C1C"}
            />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        )}

        {!loading && !error && tracking && receiver && (
          <>
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.summaryCard}
            >
              <View style={styles.summaryTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Booking Number</Text>
                  <Text style={styles.trackingNumber}>
                    {tracking.rgl_booking_number}
                  </Text>
                  <Text style={styles.summarySub}>{tracking.booking_ref}</Text>
                </View>
                {/* <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: chip?.bg ?? colors.background },
                  ]}
                >
                  <Ionicons
                    name="ellipse"
                    size={10}
                    color={chip ? colors[chip.colorKey] : colors.secondary}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      {
                        color: chip ? colors[chip.colorKey] : colors.secondary,
                      },
                    ]}
                  >
                    {receiver.current_status}
                  </Text>
                </View> */}
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color="#0d6c6a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeLabel}>Origin</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {tracking.place_of_loading}
                    </Text>
                  </View>
                </View>
                <View style={styles.routeDivider}>
                  <View style={styles.routeDashLine} />
                  <Ionicons
                    name="boat"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <View style={styles.routeDashLine} />
                </View>
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color="#f58220" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeLabel}>Destination</Text>
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
                      {receiverItem.item_ref}
                    </Text>
                  </View>
                  <View style={styles.itemStat}>
                    <Ionicons
                      name="cube-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.itemStatText}>
                      {receiverItem.total_number} Boxes
                    </Text>
                  </View>
                  <View style={styles.itemStat}>
                    <Ionicons
                      name="scale-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.itemStatText}>
                      {receiverItem.weight} KG
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>

            <Timeline
              steps={trackingSteps}
              eta={receiver.eta}
              styles={styles}
            />
          </>
        )}

        {!loading && !error && !tracking && (
          <View style={styles.centerBlock}>
            <Ionicons
              name="search-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {selectedOrder
                ? "Select an item to view tracking"
                : "Select an order to get started"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
    bodyContainer: {
      paddingHorizontal: 20,
    },
    pickerRow: {
      flexDirection: "row",
      gap: 10,
      marginVertical: 10,
    },
    pickerField: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    pickerFieldDisabled: {
      opacity: 0.5,
    },
    pickerLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginBottom: 4,
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
      color: colors.text,
    },
    centerBlock: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 10,
    },
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
      gap: 16,
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },
    summaryLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summarySub: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    trackingNumber: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xl,
      color: colors.text,
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    statusChipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 11,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#F8FAFC",
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    routePoint: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      alignItems: "flex-start",
    },
    routeLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    routeValue: {
      fontFamily: fonts.medium ?? fonts.semiBold,
      fontSize: fontSize.xs ?? 12,
      color: colors.text,
    },
    routeDivider: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 2,
      gap: 3,
    },
    routeDashLine: {
      width: 1,
      height: 12,
      backgroundColor: colors.borderColor,
    },
    itemStatsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      paddingTop: 12,
    },
    itemStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    itemStatText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      maxWidth: 160,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.text,
      marginBottom: 10,
      marginLeft: 4,
    },
    timelineWrap: {
      backgroundColor: colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderColor,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 18,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 1,
    },
    stepRow: {
      flexDirection: "row",
    },
    dotColumn: {
      alignItems: "center",
      width: 32,
    },
    dotOuter: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.borderColor,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    dotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#fff",
    },
    pulseRing: {
      position: "absolute",
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    lineTrack: {
      width: 2,
      flex: 1,
      minHeight: 40,
      backgroundColor: colors.borderColor,
      marginTop: 2,
      overflow: "hidden",
    },
    lineFill: {
      width: "100%",
    },
    stepContent: {
      flex: 1,
      marginLeft: 14,
      paddingBottom: 28,
    },
    stepTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
      marginBottom: 2,
    },
    stepTitlePending: {
      color: colors.textSecondary,
    },
    stepDate: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    stepDatePending: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: "#CBD5E1",
    },
    etaCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.background,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    etaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    etaDate: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg ?? fontSize.xl,
      color: colors.text,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15,23,42,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 30,
      maxHeight: "60%",
    },
    modalHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderColor,
      marginBottom: 14,
    },
    modalTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
      marginBottom: 8,
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    modalRowText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    modalSeparator: {
      height: 1,
      backgroundColor: colors.borderColor,
    },
  });
