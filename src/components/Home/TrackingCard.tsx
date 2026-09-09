import { api } from "@/api";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";

type Tab = "tracking" | "storage";

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

const TrackingHomeCard = () => {
  const { orders } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const [tab, setTab] = useState<Tab>("tracking");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingData, setTrackingData] = useState<TrackingApiData | null>(
    null,
  );

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setTrackingData(null);
  };

  const handleTrackingSearch = async (ref: string) => {
    const res = await api.get(
      `shipments/track/item/${encodeURIComponent(ref)}`,
    );
    const data = res?.data?.data;

    if (!data?.order_id) {
      setError(`No shipment found for "${ref}"`);
      return;
    }

    setTrackingData(data as TrackingApiData);
  };

  const handleStorageSearch = (ref: string) => {
    const matchedOrder = orders.find(
      (o) => o.booking_number.toLowerCase() === ref.trim().toLowerCase(),
    );

    if (!matchedOrder) {
      setError(`No order found containing item "${ref}"`);
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
          ? `No shipment found for "${ref}"`
          : err?.response?.data?.message || "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const receiver = trackingData?.receivers?.[0];
  const receiverItem = receiver?.items?.[0];

  return (
    <Animated.View
      layout={Layout.springify().damping(16)}
      style={styles.wrapper}
    >
      <View style={styles.suggestionsRow}>
        <TouchableOpacity
          style={[
            styles.suggestionCard,
            tab === "tracking" ? styles.suggestionCardFilled : {},
          ]}
          activeOpacity={0.85}
          onPress={() => switchTab("tracking")}
        >
          <View
            style={
              tab === "tracking"
                ? styles.suggestionIconCircleFilled
                : styles.suggestionIconCircle
            }
          >
            <Ionicons
              name="navigate-outline"
              size={18}
              color={tab === "tracking" ? "#fff" : colors.primary}
            />
          </View>
          <Text
            style={
              tab === "tracking"
                ? styles.suggestionTitleFilled
                : styles.suggestionTitle
            }
          >
            Track
          </Text>
          <Text
            style={
              tab === "tracking"
                ? styles.suggestionSubFilled
                : styles.suggestionSub
            }
          >
            Track your shipment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.suggestionCard,
            tab === "storage" ? styles.suggestionCardFilled : {},
          ]}
          activeOpacity={0.85}
          onPress={() => switchTab("storage")}
        >
          <View
            style={
              tab === "storage"
                ? styles.suggestionIconCircleFilled
                : styles.suggestionIconCircle
            }
          >
            <Ionicons
              name="cube-outline"
              size={18}
              color={tab === "storage" ? "#fff" : colors.primary}
            />
          </View>
          <Text
            style={
              tab === "storage"
                ? styles.suggestionTitleFilled
                : styles.suggestionTitle
            }
          >
            Book Storage
          </Text>
          <Text
            style={
              tab === "storage"
                ? styles.suggestionSubFilled
                : styles.suggestionSub
            }
          >
            Need time? Buy Storage
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            if (error) setError(null);
            if (trackingData) setTrackingData(null);
          }}
          placeholder={
            tab === "tracking"
              ? "Track a shipment. e.g. ORDER-ITEM-REF-1-1-1787655955056"
              : "Enter Booking Number. e.g. TEST4106"
          }
          placeholderTextColor={colors.lightText}
          style={styles.input}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.actionButton}
            activeOpacity={0.85}
            disabled={!query.trim()}
          >
            <Text style={styles.actionButtonText}>
              {tab === "tracking" ? "Search" : "Storage"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={styles.errorRow}
        >
          <Ionicons name="alert-circle-outline" size={15} color="#B4690E" />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {trackingData && receiver && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOutUp.duration(300)}
          layout={Layout.springify().damping(16)}
          style={styles.trackingDetailsCard}
        >
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Booking Number</Text>
              <Text style={styles.trackingNumber}>
                {trackingData.rgl_booking_number}
              </Text>
            </View>
            <View style={styles.statusChip}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={[styles.statusChipText, { color: colors.primary }]}>
                {receiver.current_status}
              </Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Ionicons name="location" size={16} color="#0d6c6a" />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Origin</Text>
                <Text style={styles.routeValue} numberOfLines={2}>
                  {trackingData.place_of_loading}
                </Text>
              </View>
            </View>
            <View style={styles.routeDivider}>
              <View style={styles.routeDashLine} />
              <Ionicons name="boat" size={14} color={colors.textSecondary} />
              <View style={styles.routeDashLine} />
            </View>
            <View style={styles.routePoint}>
              <Ionicons name="flag" size={16} color="#f58220" />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Destination</Text>
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

          <TouchableOpacity
            style={styles.fullDetailsButton}
            onPress={() =>
              router.navigate({
                pathname: "/tracking",
                params: { orderId: String(trackingData.order_id) },
              })
            }
          >
            <Text style={styles.fullDetailsText}>View Full Timeline</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    input: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium ?? fonts.regular,
      color: colors.text,
      paddingVertical: 2,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    actionButtonText: {
      color: "#fff",
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.semiBold,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: "#FFF3E0",
      borderRadius: 10,
      borderLeftWidth: 3,
      borderColor: "#B4690E",
    },
    errorText: {
      flex: 1,
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.medium,
      color: "#B4690E",
    },
    suggestionsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 15,
    },
    suggestionCard: {
      flex: 1,
      borderRadius: 20,
      padding: 15,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    suggestionCardFilled: {
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    suggestionIconCircle: {
      width: 30,
      height: 30,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EAF6F5",
      marginBottom: 10,
    },
    suggestionIconCircleFilled: {
      width: 30,
      height: 30,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
      marginBottom: 10,
    },
    suggestionTitle: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 2,
    },
    suggestionTitleFilled: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: "#fff",
      marginBottom: 2,
    },
    suggestionSub: {
      fontSize: fontSize.xs ?? 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    suggestionSubFilled: {
      fontSize: fontSize.xs ?? 11,
      fontFamily: fonts.regular,
      color: "rgba(255,255,255,0.85)",
    },
    trackingDetailsCard: {
      marginTop: 16,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 16,
    },
    summaryLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    trackingNumber: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg ?? 18,
      color: colors.text,
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#ECFDF5",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusChipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 11,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      padding: 12,
      gap: 8,
      marginBottom: 12,
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
      height: 10,
      backgroundColor: colors.borderColor,
    },
    itemStatsRow: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 16,
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
    },
    fullDetailsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      paddingTop: 14,
    },
    fullDetailsText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.primary,
    },
  });

export default TrackingHomeCard;
