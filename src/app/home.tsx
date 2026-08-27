import { api } from "@/api";
import { EmptyState } from "@/components/Home/EmptyState";
import { QuickAction } from "@/components/Home/QuickAction";
import { RecentInvoiceCard } from "@/components/Home/RecentInvoice";
import { RecentShipmentCard } from "@/components/Home/RecentShipment";
import HomeHeader from "@/components/ui/HomeHeader";
import ProfileSidebar from "@/components/ui/ProfileSidebar";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import moment from "moment";
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

interface RecentOrder {
  order_id: number | string;
  rgl_booking_number: string;
  place_of_loading: string | number;
  place_of_destination: string | number;
  loading_place_name: string;
  destination_place_name: string;
  eta: string | null;
  status: string;
  created_at: string;
}

interface RecentInvoice {
  id: number;
  invoice_id: string;
  created_at: string;
  due_at: string | null;
  status: "paid" | "unpaid" | string;
  amount: number;
}

interface DashboardData {
  total_orders: number;
  total_invoices: number;
  recent_orders: RecentOrder[];
  recent_invoices: RecentInvoice[];
}

const Home = () => {
  const { user } = useAuth();
  const { openProfile, setOpenProfile } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerId = user?.customer_id;

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      if (!customerId) {
        setLoading(false);
        setError("No receiver linked to this account.");
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await api.get(`/dashboard/${customerId}`);

        const payload = response?.data?.data ?? null;

        setData({
          total_orders: Number(payload?.total_orders ?? 0),
          total_invoices: Number(payload?.total_invoices ?? 0),
          recent_orders: Array.isArray(payload?.recent_orders)
            ? payload.recent_orders
            : [],
          recent_invoices: Array.isArray(payload?.recent_invoices)
            ? payload.recent_invoices
            : [],
        });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setData({
            total_orders: 0,
            total_invoices: 0,
            recent_orders: [],
            recent_invoices: [],
          });
        } else {
          setError(
            err?.response?.data?.message ||
              "Couldn't load your dashboard. Pull down to try again.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId],
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  const recentOrders = data?.recent_orders ?? [];
  const recentInvoices = data?.recent_invoices ?? [];
  const sortedOrders = [...recentOrders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const latestOrder = sortedOrders[0] ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeHeader />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />
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
        {error && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.errorCard}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#B4690E" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchDashboard()} hitSlop={8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {latestOrder && (
          <Animated.View entering={FadeInDown.duration(450).delay(120)}>
            <TouchableOpacity
              style={styles.shipmentHero}
              activeOpacity={0.85}
              onPress={() =>
                router.navigate({
                  pathname: "/shipment-details",
                  params: { bookingNumber: latestOrder.rgl_booking_number },
                })
              }
            >
              <Text style={styles.heroLabel}>Latest Shipment</Text>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroBookingId}>
                  {latestOrder.rgl_booking_number}
                </Text>
                <View style={styles.heroStatusPill}>
                  <Text style={styles.heroStatusText}>
                    {latestOrder.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroRoute}>
                {latestOrder.loading_place_name}
              </Text>
              <View style={styles.heroBottomRow}>
                <Text style={styles.heroRoute}>
                  {latestOrder.destination_place_name}
                </Text>
                <Text style={styles.heroEta}>
                  ETA:{" "}
                  {latestOrder.eta
                    ? moment(latestOrder.eta).format("D MMM YYYY")
                    : "—"}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={styles.quickActionsRow}
        >
          <QuickAction
            icon="cube-outline"
            label="Shipments"
            onPress={() => router.navigate("/shipments")}
          />
          <QuickAction
            icon="navigate-outline"
            label="Tracking"
            onPress={() => router.navigate("/tracking")}
          />
          <QuickAction
            icon="car-outline"
            label="Delivery Options"
            onPress={() => router.navigate("/delivery-options")}
          />
          <QuickAction
            icon="archive-outline"
            label="Storage"
            onPress={() => router.navigate("/purchase-storage")}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(280)}
          style={styles.quickActionsRow}
        >
          <QuickAction
            icon="document-text-outline"
            label="Gatepass History"
            onPress={() => router.navigate("/gatepass-history")}
          />
          <QuickAction
            icon="receipt-outline"
            label="Invoices"
            onPress={() => router.navigate("/invoices")}
          />
          <QuickAction
            icon="notifications-outline"
            label="Alerts"
            onPress={() => router.navigate("/alerts")}
          />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            label="Support"
            onPress={() => router.navigate("/support")}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(320)}
          style={styles.sectionHeaderRow}
        >
          <Text style={styles.sectionTitle}>Recent Shipments</Text>
          <TouchableOpacity
            onPress={() => router.navigate("/shipments")}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {sortedOrders.length === 0 ? (
          <EmptyState label="No recent shipments yet." />
        ) : (
          sortedOrders.map((order, index) => (
            <RecentShipmentCard
              key={`${order.rgl_booking_number}-${index}`}
              order={order}
              index={index}
            />
          ))
        )}

        <Animated.View
          entering={FadeInDown.duration(400).delay(360)}
          style={styles.sectionHeaderRow}
        >
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity
            onPress={() => router.navigate("/invoices")}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </Animated.View>

        {recentInvoices.length === 0 ? (
          <EmptyState label="No recent invoices yet." />
        ) : (
          recentInvoices.map((invoice, index) => (
            <RecentInvoiceCard
              key={invoice.id ?? index}
              invoice={invoice}
              index={index}
            />
          ))
        )}
      </ScrollView>

      <ProfileSidebar
        visible={openProfile}
        onClose={() => setOpenProfile(false)}
      />
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
    },
    bodyContainer: {
      padding: 20,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: "#FFF3E0",
      borderRadius: 12,
      borderLeftWidth: 4,
      borderColor: "#B4690E",
    },
    errorText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: "#B4690E",
    },
    retryText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: "#B4690E",
      textDecorationLine: "underline",
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    seeAllText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: "#f58220",
    },
    quickActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: 4,
    },
    shipmentHero: {
      padding: 20,
      backgroundColor: colors.primary,
      borderRadius: 20,
      marginTop: 4,
      marginBottom: 8,
    },
    heroLabel: {
      fontSize: fontSize.xs,
      color: colors.background,
      fontFamily: fonts.semiBold,
      opacity: 0.85,
      marginBottom: 6,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    heroBookingId: {
      fontSize: fontSize.lg,
      color: "#f58220",
      fontFamily: fonts.bold,
    },
    heroStatusPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: "#f58220",
    },
    heroStatusText: {
      fontSize: fontSize.xs,
      color: colors.background,
      fontFamily: fonts.semiBold,
    },
    heroRoute: {
      fontSize: fontSize.sm,
      color: colors.background,
      fontFamily: fonts.regular,
      opacity: 0.9,
      marginTop: 2,
    },
    heroBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    heroEta: {
      fontSize: fontSize.sm,
      color: colors.background,
      fontFamily: fonts.semiBold,
    },
  });

export default Home;
