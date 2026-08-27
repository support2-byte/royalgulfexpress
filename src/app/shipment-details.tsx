import { api } from "@/api";
import Header from "@/components/ui/Header";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShipmentItem {
  order_item_id: number;
  item_ref: string;
  status: string | null;
  category: string | null;
  subcategory: string | null;
  type: string | null;
  total_number: string | number | null;
  weight: string | number | null;
  total_weight: string | number | null;
  delivered_qty: number | null;
  remaining_qty: number | null;
  eta: string | null;
  sender: {
    sender_name: string | null;
    sender_contact: string | null;
    sender_address: string | null;
  } | null;
}

interface DeliveryRecord {
  id: number;
  item_ref: string;
  status: string | null;
  delivery_amount: string | number | null;
  delivery_address: string | null;
}

interface StorageRecord {
  id: number;
  item_ref: string;
  status: string | null;
  storage: number | null;
  days: number | null;
  amount: string | number | null;
}

interface ShipmentDetails {
  order_id: number;
  rgl_booking_number: string;
  created_at: string;
  loading_place_name: string | null;
  destination_place_name: string | null;
  receiver: {
    receiver_name: string | null;
    receiver_contact: string | null;
    receiver_address: string | null;
    status: string | null;
  };
  delivery: DeliveryRecord[];
  storage: StorageRecord[];
  items: ShipmentItem[];
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusPalette: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#E8F5E9", text: "#16803C" },
  pending: { bg: "#FFF3E0", text: "#B4690E" },
  rejected: { bg: "#FDECEA", text: "#C0392B" },
};

const getStatusStyle = (status: string | null) => {
  if (!status) return { bg: "#F0F0F0", text: "#666" };
  return statusPalette[status.toLowerCase()] ?? { bg: "#F0F0F0", text: "#666" };
};

const ShipmentDetailsScreen = () => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const { user } = useAuth();
  const { bookingNumber } = useLocalSearchParams<{ bookingNumber: string }>();

  const [data, setData] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerId = user?.customer_id;

  const fetchShipment = useCallback(
    async (isRefresh = false) => {
      if (!bookingNumber || !customerId) {
        setLoading(false);
        setError("Missing shipment reference.");
        return;
      }

      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);

        const response = await api.get(`/shipments/${bookingNumber}/shipment`, {
          params: { customer_id: customerId },
        });

        setData(response?.data?.data ?? null);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Couldn't load shipment details. Pull down to try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingNumber, customerId],
  );

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  const onRefresh = useCallback(() => fetchShipment(true), [fetchShipment]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          name="Shipment Details"
          description="Loading shipment information"
          icon="cube"
        />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          name="Shipment Details"
          description="Something went wrong"
          icon="cube"
        />
        <View style={styles.centerFill}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.error}
          />
          <Text style={styles.emptyText}>{error ?? "Shipment not found."}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchShipment()}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalBoxes = data.items.reduce(
    (sum, i) => sum + (Number(i.total_number) || 0),
    0,
  );
  const totalWeight = data.items.reduce(
    (sum, i) => sum + (Number(i.weight) || 0),
    0,
  );
  const receiverSt = getStatusStyle(data.receiver.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Shipment Details"
        description={data.rgl_booking_number}
        icon="cube"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(350)}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{data.rgl_booking_number}</Text>
          </View>
          <Text style={styles.dateText}>
            Created {formatDate(data.created_at)}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(350).delay(60)}
          style={styles.routeCard}
        >
          <View style={styles.routePointRow}>
            <View style={styles.routeDotOrigin} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>
                {data.loading_place_name ?? "—"}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePointRow}>
            <View style={styles.routeDotDestination} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>
                {data.destination_place_name ?? "—"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(350).delay(100)}
          style={styles.summaryRow}
        >
          <View style={styles.summaryPill}>
            <Ionicons
              name="albums-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.summaryText}>
              {data.items.length} item{data.items.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons
              name="cube-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.summaryText}>{totalBoxes} Boxes</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons
              name="scale-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.summaryText}>{totalWeight} KG</Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(350).delay(140)}
          style={styles.card}
        >
          <View style={styles.cardLabelRow}>
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={colors.secondary}
            />
            <Text style={styles.cardLabel}>Receiver</Text>
          </View>
          <Text style={styles.cardTitle}>
            {data.receiver.receiver_name || "—"}
          </Text>
          {!!data.receiver.receiver_contact && (
            <View style={styles.locationRow}>
              <Ionicons
                name="call-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.cardText}>
                {data.receiver.receiver_contact}
              </Text>
            </View>
          )}
          {!!data.receiver.receiver_address && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.cardText}>
                {data.receiver.receiver_address}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(160)}>
          <Text style={styles.sectionTitle}>Items</Text>
        </Animated.View>

        {data.items.map((item, index) => {
          const ist = getStatusStyle(item.status);
          return (
            <Animated.View
              key={item.order_item_id}
              entering={FadeInDown.duration(350).delay(180 + index * 50)}
              style={styles.card}
            >
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.subcategory || item.category || "Item"}
                </Text>
                <View style={[styles.itemChip, { backgroundColor: ist.bg }]}>
                  <Text style={[styles.itemChipText, { color: ist.text }]}>
                    {item.status ?? "Pending"}
                  </Text>
                </View>
              </View>
              <Text
                style={{ ...styles.itemRef, marginBottom: 10 }}
                numberOfLines={1}
              >
                {item.item_ref}
              </Text>

              <View style={styles.itemMetaGrid}>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>Category</Text>
                  <Text style={styles.itemMetaValue}>
                    {item.category || "—"}
                  </Text>
                </View>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>Type</Text>
                  <Text style={styles.itemMetaValue}>{item.type || "—"}</Text>
                </View>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>Quantity</Text>
                  <Text style={styles.itemMetaValue}>
                    {item.total_number ?? "—"}
                  </Text>
                </View>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>Weight</Text>
                  <Text style={styles.itemMetaValue}>
                    {item.weight ? `${item.weight} KG` : "—"}
                  </Text>
                </View>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>ETA</Text>
                  <Text style={styles.itemMetaValue}>
                    {formatDate(item.eta)}
                  </Text>
                </View>
                <View style={styles.itemMetaCell}>
                  <Text style={styles.itemMetaLabel}>Remaining</Text>
                  <Text style={styles.itemMetaValue}>
                    {item.remaining_qty ?? "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.senderBlock}>
                <View style={styles.cardLabelRow}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={colors.secondary}
                  />
                  <Text style={styles.cardLabel}>Sender</Text>
                </View>
                {item.sender?.sender_name ? (
                  <>
                    <Text style={styles.cardText}>
                      {item.sender.sender_name}
                    </Text>
                    <Text style={styles.cardTextMuted}>
                      {item.sender.sender_contact || "No contact on file"}
                    </Text>
                    <Text style={styles.cardTextMuted}>
                      {item.sender.sender_address || "No address on file"}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.cardTextMuted}>
                    No sender information available
                  </Text>
                )}
              </View>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInDown.duration(350).delay(220)}>
          <Text style={styles.sectionTitle}>Storage</Text>
        </Animated.View>
        {data.storage.length > 0 ? (
          data.storage.map((s, index) => {
            const sst = getStatusStyle(s.status);
            return (
              <Animated.View
                key={s.id}
                entering={FadeInDown.duration(350).delay(240 + index * 50)}
                style={styles.card}
              >
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {s.storage} KG · {s.days} days
                  </Text>
                  <View style={[styles.itemChip, { backgroundColor: sst.bg }]}>
                    <Text style={[styles.itemChipText, { color: sst.text }]}>
                      {s.status ?? "Pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemRef} numberOfLines={1}>
                    {s.item_ref}
                  </Text>
                  <Text style={styles.amountText}>
                    AED {Number(s.amount || 0).toLocaleString()}
                  </Text>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTextMuted}>
              No storage purchases for this shipment
            </Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.duration(350).delay(280)}>
          <Text style={styles.sectionTitle}>Delivery</Text>
        </Animated.View>
        {data.delivery.length > 0 ? (
          data.delivery.map((d, index) => {
            const dst = getStatusStyle(d.status);
            return (
              <Animated.View
                key={d.id}
                entering={FadeInDown.duration(350).delay(300 + index * 50)}
                style={styles.card}
              >
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    Delivery Request
                  </Text>
                  <View style={[styles.itemChip, { backgroundColor: dst.bg }]}>
                    <Text style={[styles.itemChipText, { color: dst.text }]}>
                      {d.status ?? "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemRef} numberOfLines={1}>
                  {d.item_ref}
                </Text>
                {!!d.delivery_address && (
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.cardText}>{d.delivery_address}</Text>
                  </View>
                )}
                <Text style={styles.amountText}>
                  AED {Number(d.delivery_amount || 0).toLocaleString()}
                </Text>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTextMuted}>
              No delivery requests for this shipment
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerFill: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 30,
    },
    bodyContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: fontSize.xl,
      color: colors.text,
    },
    dateText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    routeCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
    },
    routePointRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    routeDotOrigin: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#f58220",
    },
    routeDotDestination: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.background,
    },
    routeLine: {
      width: 1,
      height: 16,
      backgroundColor: colors.background,
      opacity: 0.4,
      marginLeft: 4.5,
      marginVertical: 4,
    },
    routeLabel: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 10,
      color: colors.background,
      opacity: 0.8,
      marginBottom: 2,
    },
    routeValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.background,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    summaryPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: "#F5F6F8",
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    summaryText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.text,
      marginTop: 8,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    cardLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    cardLabel: {
      fontFamily: fonts.bold,
      fontSize: fontSize.xs ?? 11,
      color: colors.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg,
      color: colors.text,
      marginBottom: 6,
    },
    cardText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    cardTextMuted: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    cardChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
    },
    itemHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    itemTitle: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
    },
    itemRef: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
    },
    itemChip: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    itemChipText: {
      fontFamily: fonts.semiBold,
      fontSize: 10,
    },
    itemMetaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    itemMetaCell: {
      width: "30%",
      minWidth: 90,
    },
    itemMetaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    itemMetaValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    senderBlock: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
    },
    amountText: {
      textAlign: "right",
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: "#f58220",
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
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

export default ShipmentDetailsScreen;
