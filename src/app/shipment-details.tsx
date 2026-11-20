import { api } from "@/api";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { StateView } from "@/components/ui/StateView";
import { QuickAction } from "@/components/Home/QuickAction";
import {
  isOrderRole,
  roleCan,
  type Feature,
  type OrderRole,
} from "@/constants/permissions";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { flipIcon, tr, ls } from "@/i18n";
import DeliveryOptionsIcon from "@assets/icons/delivery.png";
import GatepassIcon from "@assets/icons/gatepass.png";
import StorageIcon from "@assets/icons/storage.png";
import { router } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShipmentItem {
  order_item_id: number;
  item_ref: string;
  tracking_id: string | null;
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
  tracking_id: string | null;
  status: string | null;
  delivery_amount: string | number | null;
  delivery_address: string | null;
}

interface StorageRecord {
  id: number;
  item_ref: string;
  tracking_id: string | null;
  status: string | null;
  storage: number | null;
  days: number | null;
  amount: string | number | null;
}

interface ShipmentDetails {
  /** Which side of this order the logged-in customer is on. */
  role?: OrderRole | null;
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

const ACTIONS: {
  feature: Feature;
  label: string;
  description: string;
  path: string;
  icon: any;
}[] = [
  {
    feature: "drop-off",
    label: "Drop-off",
    description: "Schedule a pickup from the sender",
    path: "/drop-off",
    icon: DeliveryOptionsIcon,
  },
  {
    feature: "delivery",
    label: "Delivery options",
    description: "Choose how you receive it",
    path: "/delivery-options",
    icon: DeliveryOptionsIcon,
  },
  {
    feature: "storage",
    label: "Storage",
    description: "Buy extra storage time",
    path: "/purchase-storage",
    icon: StorageIcon,
  },
  {
    feature: "gatepass",
    label: "Gatepass history",
    description: "Past gatepasses",
    path: "/gatepass-history",
    icon: GatepassIcon,
  },
];

const ROLE_TEXT: Record<OrderRole, string> = {
  sender: "You are the sender on this booking",
  receiver: "You are the receiver on this booking",
  both: "You are the sender and receiver on this booking",
};

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
  const sheet = useSheetStyle();
  const { user, can } = useAuth();
  const { roleOf } = useAppContext();
  const { bookingNumber } = useLocalSearchParams<{ bookingNumber: string }>();

  const [data, setData] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = useCallback(async (ref: string) => {
    await Clipboard.setStringAsync(ref);
    setCopiedRef(ref);
    setTimeout(
      () => setCopiedRef((current) => (current === ref ? null : current)),
      1500,
    );
  }, []);

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

  const headerEl = (desc: string) => (
    <Header name="Shipment details" description={desc} icon="cube" />
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        {headerEl("Loading shipment information")}
        <View style={sheet}>
          <StateView loading />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        {headerEl("Something went wrong")}
        <View style={sheet}>
          <StateView
            icon="cloud-offline-outline"
            label={error ?? "Shipment not found."}
            actionLabel={tr("Try again")}
            onAction={() => fetchShipment()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Role comes from the API (customer ref matched against this order's
  // sender / receiver refs); the account-level list and account type are only
  // fallbacks for older backends.
  const role: OrderRole | null = isOrderRole(data.role)
    ? data.role
    : roleOf(data.rgl_booking_number);
  const allowed = (feature: Feature) =>
    role ? roleCan(role, feature) : can(feature);
  const actions = ACTIONS.filter((a) => allowed(a.feature));
  const showReceiverServices = allowed("storage") || allowed("delivery");

  const totalBoxes = data.items.reduce(
    (sum, i) => sum + (Number(i.total_number) || 0),
    0,
  );
  const totalWeight = data.items.reduce(
    (sum, i) => sum + (Number(i.weight) || 0),
    0,
  );

  const StatusText = ({ status }: { status: string | null }) => {
    const st = getStatusStyle(status);
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: st.text }]} />
        <Text style={[styles.statusText, { color: st.text }]}>
          {status ?? "Pending"}
        </Text>
      </View>
    );
  };

  const Meta = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {headerEl(tr("Created {date}", { date: formatDate(data.created_at) }))}

      <View style={sheet}>
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
          <Animated.View entering={FadeInDown.duration(380)}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.routePanel}
            >
              <Text style={styles.routeKicker}>{tr("Booking number")}</Text>
              <Text style={styles.title}>{data.rgl_booking_number}</Text>

              <View style={styles.routeBlock}>
                <View style={styles.routeRow}>
                  <View
                    style={[styles.routeDot, { backgroundColor: "#fff" }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeLabel}>{tr("From")}</Text>
                    <Text style={styles.routeValue}>
                      {data.loading_place_name ?? "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View
                    style={[
                      styles.routeDot,
                      { backgroundColor: colors.secondary },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeLabel}>{tr("To")}</Text>
                    <Text style={styles.routeValue}>
                      {data.destination_place_name ?? "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(380).delay(80)}
            style={styles.stats}
          >
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.items.length}</Text>
              <Text style={styles.statLabel}>
                Item{data.items.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalBoxes}</Text>
              <Text style={styles.statLabel}>{tr("Boxes")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalWeight}</Text>
              <Text style={styles.statLabel}>{tr("Kg")}</Text>
            </View>
          </Animated.View>

          {role && (
            <Animated.View
              entering={FadeInDown.duration(380).delay(100)}
              style={styles.roleRow}
            >
              <Ionicons
                name={
                  role === "sender"
                    ? "arrow-up-circle-outline"
                    : role === "receiver"
                      ? "arrow-down-circle-outline"
                      : "swap-vertical-outline"
                }
                size={18}
                color={colors.primary}
              />
              <Text style={styles.roleText}>{tr(ROLE_TEXT[role])}</Text>
            </Animated.View>
          )}

          {actions.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{tr("Services")}</Text>
              {actions.map((a, index) => (
                <QuickAction
                  key={a.path}
                  icon={a.icon}
                  label={tr(a.label)}
                  description={tr(a.description)}
                  index={index}
                  onPress={() =>
                    router.navigate({
                      pathname: a.path as any,
                      params: { bookingNumber: data.rgl_booking_number },
                    })
                  }
                />
              ))}
            </View>
          )}

          <Animated.View entering={FadeInDown.duration(380).delay(120)}>
            <Text style={styles.sectionTitle}>{tr("Receiver")}</Text>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>
                {data.receiver.receiver_name || "—"}
              </Text>
              {!!data.receiver.receiver_contact && (
                <View style={styles.lineRow}>
                  <Ionicons
                    name="call-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.lineText}>
                    {data.receiver.receiver_contact}
                  </Text>
                </View>
              )}
              {!!data.receiver.receiver_address && (
                <View style={styles.lineRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.lineText}>
                    {data.receiver.receiver_address}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          <Text style={styles.sectionTitle}>{tr("Items")}</Text>
          {data.items.map((item, index) => (
            <Animated.View
              key={item.order_item_id}
              entering={FadeInDown.duration(360).delay(
                160 + Math.min(index, 5) * 50,
              )}
              style={styles.block}
            >
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle} numberOfLines={1}>
                  {item.subcategory || item.category || "Item"}
                </Text>
                <StatusText status={item.status} />
              </View>

              <TouchableOpacity
                style={styles.lineRow}
                onPress={() => item.tracking_id && handleCopy(item.tracking_id)}
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
                  size={13}
                  color={
                    copiedRef === item.tracking_id
                      ? colors.primary
                      : colors.lightText
                  }
                />
              </TouchableOpacity>

              <View style={styles.metaGrid}>
                <Meta label="Category" value={item.category || "—"} />
                <Meta label="Type" value={item.type || "—"} />
                <Meta label="Quantity" value={item.total_number ?? "—"} />
                <Meta
                  label="Weight"
                  value={item.weight ? `${item.weight} kg` : "—"}
                />
                <Meta label="ETA" value={formatDate(item.eta)} />
                <Meta label="Remaining" value={item.remaining_qty ?? "—"} />
              </View>

              <View style={styles.sender}>
                <Text style={styles.senderLabel}>{tr("Sender")}</Text>
                {item.sender?.sender_name ? (
                  <>
                    <Text style={styles.lineTextStrong}>
                      {item.sender.sender_name}
                    </Text>
                    <Text style={styles.lineTextMuted}>
                      {item.sender.sender_contact || "No contact on file"}
                    </Text>
                    <Text style={styles.lineTextMuted}>
                      {item.sender.sender_address || "No address on file"}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.lineTextMuted}>
                    {tr("No sender information available")}
                  </Text>
                )}
              </View>
            </Animated.View>
          ))}

          {showReceiverServices && (
            <Text style={styles.sectionTitle}>{tr("Storage")}</Text>
          )}
          {!showReceiverServices ? null : data.storage.length > 0 ? (
            data.storage.map((st, index) => (
              <Animated.View
                key={st.id}
                entering={FadeInDown.duration(360).delay(index * 50)}
                style={styles.block}
              >
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle} numberOfLines={1}>
                    {st.storage} kg · {st.days} days
                  </Text>
                  <StatusText status={st.status} />
                </View>
                <View style={styles.blockHeader}>
                  <Text style={styles.itemRef} numberOfLines={1}>
                    {st.tracking_id ?? "—"}
                  </Text>
                  <Text style={styles.amountText}>
                    AED {Number(st.amount || 0).toLocaleString()}
                  </Text>
                </View>
              </Animated.View>
            ))
          ) : (
            <Text style={styles.emptyLine}>
              {tr("No storage purchases for this shipment")}
            </Text>
          )}

          {showReceiverServices && (
            <Text style={styles.sectionTitle}>{tr("Delivery")}</Text>
          )}
          {!showReceiverServices ? null : data.delivery.length > 0 ? (
            data.delivery.map((d, index) => (
              <Animated.View
                key={d.id}
                entering={FadeInDown.duration(360).delay(index * 50)}
                style={styles.block}
              >
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle} numberOfLines={1}>
                    {tr("Delivery request")}
                  </Text>
                  <StatusText status={d.status} />
                </View>
                <Text style={styles.itemRef} numberOfLines={1}>
                  {d.tracking_id ?? "—"}
                </Text>
                {!!d.delivery_address && (
                  <View style={styles.lineRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.lineText}>{d.delivery_address}</Text>
                  </View>
                )}
                <Text style={[styles.amountText, { marginTop: 8 }]}>
                  AED {Number(d.delivery_amount || 0).toLocaleString()}
                </Text>
              </Animated.View>
            ))
          ) : (
            <Text style={styles.emptyLine}>
              {tr("No delivery requests for this shipment")}
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    bodyContainer: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
    routePanel: { borderRadius: 28, padding: 22 },
    routeKicker: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: "rgba(255,255,255,0.72)",
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: fontSize.xxl,
      color: "#fff",
      letterSpacing: ls(-0.4),
      marginTop: 2,
    },
    routeBlock: { marginTop: 20 },
    routeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeLine: {
      width: 1,
      height: 22,
      marginLeft: 4.5,
      backgroundColor: "rgba(255,255,255,0.35)",
    },
    routeLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: "rgba(255,255,255,0.65)",
    },
    routeValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: "#fff",
    },
    stats: { flexDirection: "row", alignItems: "center", paddingVertical: 22 },
    stat: { flex: 1, alignItems: "center" },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: fontSize.xl,
      color: colors.ink,
      letterSpacing: ls(-0.4),
    },
    statLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: colors.borderColor,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
      marginTop: 26,
      marginBottom: 4,
    },
    block: {
      paddingVertical: 16,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    blockHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    blockTitle: {
      flexShrink: 1,
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs },
    lineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    lineText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    lineTextStrong: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    lineTextMuted: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    itemRef: {
      flexShrink: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.primary,
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 14,
      marginTop: 6,
    },
    metaCell: { width: "33.33%", paddingRight: 8 },
    metaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      marginBottom: 2,
    },
    metaValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    sender: {
      marginTop: 6,
      paddingTop: 12,
      gap: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    senderLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.lightText,
      marginBottom: 4,
    },
    roleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    roleText: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    amountText: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    emptyLine: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      paddingVertical: 14,
    },
  });

export default ShipmentDetailsScreen;
