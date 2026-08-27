import Header from "@/components/ui/Header";
import {
  DefaultStatusStyle,
  ShipmentStatus,
  ShipmentStatusKey,
} from "@/constants/theme";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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

function groupByOrder(rows: ShipmentRow[]): OrderGroup[] {
  const map = new Map<number, OrderGroup>();

  for (const row of rows) {
    if (!map.has(row.order_id)) {
      map.set(row.order_id, {
        order_id: row.order_id,
        booking_number: row.rgl_booking_number,
        pol: row.loading_place_name ?? "—",
        pod: row.destination_place_name ?? "—",
        created_at: row.created_at,
        items: [],
      });
    }

    map.get(row.order_id)!.items.push({
      order_item_id: row.order_item_id,
      item_ref: row.item_ref,
      status: row.status,
      boxes: Number(row.total_number) || 0,
      weight: Number(row.weight) || 0,
      eta: row.eta,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function Shipments() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const {
    orders,
    shipmentsLoading: loading,
    shipmentsRefreshing: refreshing,
    shipmentsError: error,
    refreshShipments,
  } = useAppContext();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const onRefresh = useCallback(
    () => refreshShipments(true),
    [refreshShipments],
  );

  const toggleExpand = (orderId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
          i.item_ref.toLowerCase().includes(q),
        );
        if (bookingMatch) return o;
        if (items.length > 0) return { ...o, items };
        return null;
      })
      .filter((o): o is OrderGroup => o !== null);
  }, [orders, search]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Shipments"
        description="Track all your shipments"
        icon="boat"
      />

      <View style={styles.searchRow}>
        <Ionicons name="search" color={colors.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          inputMode="text"
          placeholder="Search by booking # or item ref"
          placeholderTextColor={colors.lightText}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
            <Ionicons
              name="close-circle"
              color={colors.textSecondary}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.emptyText}>Loading shipments...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={colors.error}
            />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="file-tray-outline"
              size={40}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {search ? "No matching shipments" : "No shipments available"}
            </Text>
          </View>
        ) : (
          filtered.map((order, index) => (
            <OrderCard
              key={order.order_id}
              order={order}
              index={index}
              expanded={expanded.has(order.order_id)}
              onToggle={() => toggleExpand(order.order_id)}
              styles={styles}
              colors={colors}
            />
          ))
        )}
      </ScrollView>
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
}: {
  order: OrderGroup;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useAppTheme>["colors"];
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
    <Animated.View entering={FadeInDown.duration(300).delay(60 + index * 60)}>
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.75} onPress={onToggle}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{order.booking_number}</Text>
          </View>
          <Text style={styles.routeText} numberOfLines={1}>
            From: {order.pol}
          </Text>

          <Text style={styles.routeText} numberOfLines={1}>
            To: {order.pod}
          </Text>
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
              <Text style={styles.metaText}>{totalBoxes} Boxes</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="scale-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>{totalWeight} KG</Text>
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

          <View style={styles.expandRow}>
            <Text style={styles.expandText}>
              {expanded ? "Hide items" : "View items"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={15}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.itemsBlock}>
            {order.items.map((item) => {
              const ist = statusStyle(item.status);
              return (
                <View key={item.order_item_id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemRef} numberOfLines={1}>
                      {item.item_ref}
                    </Text>
                    <Text style={styles.itemSub}>
                      {item.boxes} boxes · {item.weight} KG
                    </Text>
                  </View>
                  <View style={[styles.itemChip, { backgroundColor: ist.bg }]}>
                    <Text style={[styles.itemChipText, { color: ist.text }]}>
                      {item.status ?? "Pending"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.actionsRow}>
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
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() =>
              router.navigate({
                pathname: "/tracking",
                params: { orderId: order.order_id },
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.trackBtnText}>Track</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: "#F5F6F8",
      borderWidth: 1,
      borderColor: colors.borderColor,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.text,
      padding: 0,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 30,
      gap: 10,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      flexWrap: "wrap",
    },
    routeText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 14,
      rowGap: 4,
      marginVertical: 8,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
    },
    cardChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 5,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    chipText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs ?? 11 },
    expandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
    },
    expandText: {
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
    },
    itemsBlock: {
      marginTop: 8,
      gap: 6,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#F8F9FA",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
    },
    itemRef: {
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.text,
    },
    itemSub: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
    itemChip: {
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    itemChipText: { fontFamily: fonts.semiBold, fontSize: 10 },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      paddingTop: 12,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
    },
    detailsBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    detailsBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    trackBtn: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    trackBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.background,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 10,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    retryBtn: {
      marginTop: 10,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.secondary,
    },
    retryBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.background,
    },
  });
