import { ls, tr } from "@/i18n";
import { LAYOUT } from "@/constants/motion";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { StateView } from "@/components/ui/StateView";
import {
  DefaultStatusStyle,
  ShipmentStatus,
  ShipmentStatusKey,
} from "@/constants/theme";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShipmentRow {
  order_id: number;
  rgl_booking_number: string;
  place_of_loading: number;
  final_destination: string;
  order_item_id: number;
  item_ref: string;
  status: string | null;
  total_number: string;
  weight: string;
  eta: string | null;
  loading_place_name: string | null;
  destination_place_name: string | null;
  created_at: string;
}

interface OrderItemLine {
  order_item_id: number;
  item_ref: string;
  tracking_id: string | null;
  category: string | null;
  subcategory: string | null;
  status: string | null;
  boxes: number;
  weight: number;
  eta: string | null;
}

interface OrderGroup {
  order_id: number;
  booking_number: string;
  pol: string;
  pod: string;
  created_at: string;
  items: OrderItemLine[];
}

export default function Shipments() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const {
    orders,
    shipmentsLoading: loading,
    shipmentsRefreshing: refreshing,
    shipmentsError: error,
    refreshShipments,
  } = useAppContext();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = useCallback(async (ref: string) => {
    await Clipboard.setStringAsync(ref);
    setCopiedRef(ref);
    setTimeout(
      () => setCopiedRef((current) => (current === ref ? null : current)),
      1500,
    );
  }, []);

  const onRefresh = useCallback(
    () => refreshShipments(true),
    [refreshShipments],
  );

  const toggleExpand = (orderId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;

    return orders
      .map((o) => {
        const bookingMatch = o.booking_number.toLowerCase().includes(q);
        const items = o.items.filter((i) =>
          (i.tracking_id ?? "").toLowerCase().includes(q),
        );
        if (bookingMatch) return o;
        if (items.length > 0) return { ...o, items };
        return null;
      })
      .filter((o): o is OrderGroup => o !== null);
  }, [orders, search]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Shipments"
        description={
          orders.length > 0
            ? tr(orders.length > 1 ? "{n} bookings on your account" : "{n} booking on your account", { n: orders.length })
            : "Track all your shipments"
        }
        icon="boat"
      />

      <View style={sheet}>
        <View style={styles.searchRow}>
          <Ionicons name="search" color={colors.lightText} size={18} />
          <TextInput
            style={styles.searchInput}
            inputMode="text"
            placeholder={tr("Booking number or tracking ID")}
            placeholderTextColor={colors.lightText}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons
                name="close-circle"
                color={colors.lightText}
                size={18}
              />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <StateView loading />
        ) : error ? (
          <StateView
            icon="cloud-offline-outline"
            label={error}
            actionLabel={tr("Try again")}
            onAction={onRefresh}
          />
        ) : filtered.length === 0 ? (
          <StateView
            icon="boat-outline"
            label={search ? "No matching shipments" : "No shipments available"}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {filtered.map((order, index) => (
              <OrderCard
                key={order.order_id}
                order={order}
                index={index}
                expanded={expanded.has(order.order_id)}
                onToggle={() => toggleExpand(order.order_id)}
                styles={styles}
                colors={colors}
                copiedRef={copiedRef}
                onCopy={handleCopy}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function statusStyle(status: string | null) {
  if (status && status in ShipmentStatus) {
    return ShipmentStatus[status as ShipmentStatusKey];
  }
  return DefaultStatusStyle;
}

function OrderCard({
  order,
  index,
  expanded,
  onToggle,
  styles,
  colors,
  copiedRef,
  onCopy,
}: {
  order: OrderGroup;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useAppTheme>["colors"];
  copiedRef: string | null;
  onCopy: (ref: string) => void;
}) {
  const totalBoxes = order.items.reduce((sum, i) => sum + i.boxes, 0);
  const totalWeight = order.items.reduce((sum, i) => sum + i.weight, 0);
  const itemCount = order.items.length;

  const stageOrder: ShipmentStatusKey[] = [
    "Created",
    "Under Processing",
    "Ready for Loading",
    "Loaded into Container",
    "Shipment Processing",
    "Shipment In Transit",
    "Arrived at Sort Facility",
    "Ready for Delivery",
    "Shipment Delivered",
  ];

  const orderStatus =
    order.items
      .map((i) => i.status as ShipmentStatusKey | null)
      .filter(
        (s): s is ShipmentStatusKey =>
          !!s && Object.prototype.hasOwnProperty.call(ShipmentStatus, s),
      )
      .sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))[0] ??
    "Pending";

  const st = statusStyle(orderStatus);
  const nextEta = order.items.find((i) => i.eta)?.eta;

  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 55)}
      layout={LAYOUT}
      style={styles.card}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {order.booking_number}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
            <Text
              style={[styles.chipText, { color: st.text }]}
              numberOfLines={1}
            >
              {orderStatus}
            </Text>
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRail}>
            <View style={[styles.node, { backgroundColor: colors.primary }]} />
            <View style={styles.nodeLine} />
            <View
              style={[styles.node, { backgroundColor: colors.secondary }]}
            />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.routeText} numberOfLines={1}>
              {order.pol}
            </Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {order.pod}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="albums-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons
              name="cube-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>{totalBoxes} boxes</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons
              name="scale-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>{totalWeight} kg</Text>
          </View>
          {nextEta && (
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {new Date(nextEta).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(160)}
          style={styles.itemsBlock}
        >
          {order.items.map((item, i) => {
            const ist = statusStyle(item.status);
            return (
              <Animated.View
                key={item.order_item_id}
                entering={FadeInDown.duration(260).delay(i * 50)}
                style={styles.itemRow}
              >
                <View style={[styles.itemDot, { backgroundColor: ist.dot }]} />
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.itemRefRow}
                    onPress={() => item.tracking_id && onCopy(item.tracking_id)}
                    hitSlop={8}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.itemRef} numberOfLines={1}>
                      {item.tracking_id ?? "—"}
                    </Text>
                    <Ionicons
                      name={
                        copiedRef === item.tracking_id
                          ? "checkmark"
                          : "copy-outline"
                      }
                      size={12}
                      color={
                        copiedRef === item.tracking_id
                          ? colors.primary
                          : colors.lightText
                      }
                    />
                  </TouchableOpacity>
                  <Text style={styles.itemSub}>
                    {item.boxes} boxes · {item.weight} kg
                  </Text>
                </View>
                <Text
                  style={[styles.itemStatus, { color: ist.text }]}
                  numberOfLines={1}
                >
                  {item.status ?? "Pending"}
                </Text>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={onToggle}
          hitSlop={8}
        >
          <Text style={styles.expandText}>
            {expanded ? "Hide items" : "View items"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() =>
            router.navigate({
              pathname: "/shipment-details",
              params: { bookingNumber: order.booking_number },
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.detailsBtnText}>{tr("Details")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() =>
            router.navigate({
              pathname: "/tracking",
              params: { orderId: order.order_id },
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={14} color="#fff" />
          <Text style={styles.trackBtnText}>{tr("Track")}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 22,
      marginBottom: 4,
      paddingHorizontal: 16,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.ink,
      padding: 0,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },
    card: {
      paddingVertical: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    cardTitle: {
      flexShrink: 1,
      fontFamily: fonts.bold,
      fontSize: fontSize.lg,
      color: colors.ink,
      letterSpacing: ls(-0.3),
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: "50%",
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    chipText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs },
    route: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    routeRail: {
      alignItems: "center",
      paddingVertical: 5,
    },
    node: { width: 8, height: 8, borderRadius: 4 },
    nodeLine: {
      flex: 1,
      width: 1.5,
      backgroundColor: colors.borderColor,
      marginVertical: 3,
    },
    routeTexts: { flex: 1, gap: 10 },
    routeText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 16,
      rowGap: 6,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    itemsBlock: {
      marginTop: 14,
      paddingLeft: 4,
      gap: 12,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    itemDot: { width: 8, height: 8, borderRadius: 4 },
    itemRefRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    itemRef: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    itemSub: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemStatus: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs,
      maxWidth: "36%",
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
    },
    expandBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    expandText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    detailsBtn: {
      paddingHorizontal: 18,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    detailsBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    trackBtn: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 18,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    trackBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
  });
