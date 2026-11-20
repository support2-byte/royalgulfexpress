import { api } from "@/api";
import TypewriterHeadline from "@/components/ui/TypewriterHeadline";
import { fetchCustomerInvoices, isPaidStatus } from "@/lib/invoiceApi";
import { orderStatusOf, type OrderGroup } from "@/lib/shipmentApi";
import { tr } from "@/i18n";
import { AlertsTab } from "@/components/Home/AlertsTab";
import { InvoicesTab } from "@/components/Home/InvoicesTab";
import { OverviewTab } from "@/components/Home/OverviewTab";
import { ServicesTab } from "@/components/Home/ServicesTab";
import { ShipmentsTab } from "@/components/Home/ShipmentsTab";
import TrackingSearchCard from "@/components/Home/TrackingCard";
import WheelTabs, { WheelTabItem } from "@/components/Home/WheelTabs";
import HomeHeader from "@/components/ui/HomeHeader";
import ProfileSidebar from "@/components/ui/ProfileSidebar";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DashboardData, HomeTabKey, RecentOrder } from "@/types/home";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const TAB_ITEMS: (WheelTabItem & { key: HomeTabKey })[] = [
  { key: "shipments", label: "Shipments", icon: "boat-outline", motion: "rock" },
  { key: "invoices", label: "Invoices", icon: "receipt-outline", motion: "bounce" },
  { key: "overview", label: "Overview", icon: "grid-outline", motion: "spin" },
  { key: "services", label: "Services", icon: "apps-outline", motion: "pop" },
  { key: "alerts", label: "Alerts", icon: "notifications-outline", motion: "ring" },
];

const fromOrderGroup = (o: OrderGroup): RecentOrder => ({
  order_id: o.order_id,
  rgl_booking_number: o.booking_number,
  place_of_loading: o.pol,
  place_of_destination: o.pod,
  loading_place_name: o.pol,
  destination_place_name: o.pod,
  eta: o.items.find((i) => i.eta)?.eta ?? null,
  status: orderStatusOf(o),
  created_at: o.created_at,
  item_tracking_id: o.items[0]?.tracking_id ?? undefined,
});

const Home = () => {
  const { user } = useAuth();
  const {
    openProfile,
    setOpenProfile,
    unreadNotificationCount,
    orders: accountOrders,
  } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const { height: screenHeight } = useWindowDimensions();
  const styles = createStyles(colors, fontSize, fonts, screenHeight);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<HomeTabKey>("overview");
  const directionRef = useRef(1);

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

        // The invoice list is fetched with the same call the Invoices screen
        // uses, so the counts here always agree with that screen.
        const [dashRes, invoiceRes] = await Promise.allSettled([
          api.get(`/dashboard/${customerId}`),
          fetchCustomerInvoices(customerId),
        ]);

        const dashFailed =
          dashRes.status === "rejected" &&
          dashRes.reason?.response?.status !== 404;

        if (dashFailed && invoiceRes.status === "rejected") {
          throw (dashRes as PromiseRejectedResult).reason;
        }

        const payload =
          dashRes.status === "fulfilled"
            ? (dashRes.value?.data?.data ?? null)
            : null;

        const dashInvoices = Array.isArray(payload?.recent_invoices)
          ? payload.recent_invoices
          : [];
        const invoices =
          invoiceRes.status === "fulfilled" && invoiceRes.value.length > 0
            ? invoiceRes.value
            : dashInvoices;
        const unpaid = invoices.filter((i: any) => !isPaidStatus(i.status));

        setData({
          total_orders: Number(payload?.total_orders ?? 0),
          total_invoices: Math.max(
            Number(payload?.total_invoices ?? 0),
            invoices.length,
          ),
          recent_orders: Array.isArray(payload?.recent_orders)
            ? payload.recent_orders
            : [],
          recent_invoices: invoices,
          unpaid_count: unpaid.length,
          unpaid_total: unpaid.reduce(
            (sum: number, i: any) => sum + (Number(i.amount) || 0),
            0,
          ),
        });

        if (dashFailed) {
          setError("Couldn't load your dashboard. Pull down to try again.");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Couldn't load your dashboard. Pull down to try again.",
        );
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

  // The dashboard summary can lag behind; the account's own shipment list is
  // the source of truth for what the customer actually has.
  const dashboardOrders = data?.recent_orders ?? [];
  const recentOrders =
    dashboardOrders.length > 0
      ? dashboardOrders
      : accountOrders.map(fromOrderGroup);
  const recentInvoices = data?.recent_invoices ?? [];
  const overviewData: DashboardData | null = data
    ? {
        ...data,
        total_orders: Math.max(data.total_orders, accountOrders.length),
      }
    : null;
  const sortedOrders = [...recentOrders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const tabItems = useMemo<WheelTabItem[]>(
    () =>
      TAB_ITEMS.map((t) =>
        t.key === "alerts" ? { ...t, badge: unreadNotificationCount > 0 } : t,
      ),
    [unreadNotificationCount],
  );

  const changeTab = useCallback((next: string) => {
    setTab((prev: any) => {
      const from = TAB_ITEMS.findIndex((t) => t.key === prev);
      const to = TAB_ITEMS.findIndex((t) => t.key === next);
      directionRef.current = to >= from ? 1 : -1;
      return next as HomeTabKey;
    });
  }, []);

  const SheetEnter =
    directionRef.current >= 0
      ? FadeInRight.duration(280)
      : FadeInLeft.duration(280);

  const renderTab = () => {
    switch (tab) {
      case "shipments":
        return <ShipmentsTab orders={sortedOrders} />;
      case "invoices":
        return <InvoicesTab invoices={recentInvoices} />;
      case "services":
        return <ServicesTab />;
      case "alerts":
        return <AlertsTab />;
      default:
        return (
          <OverviewTab
            data={overviewData}
            orders={sortedOrders}
            onSeeShipments={() => changeTab("shipments")}
          />
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <HomeHeader />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <HomeHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={18} color="#B4690E" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchDashboard()} hitSlop={8}>
                <Text style={styles.retryText}>{tr("Retry")}</Text>
              </TouchableOpacity>
            </View>
          )}
          <TypewriterHeadline />
          <TrackingSearchCard />
        </Animated.View>

        <WheelTabs items={tabItems} activeKey={tab} onChange={changeTab} />

        <View style={styles.sheet}>
          <Animated.View key={tab} entering={SheetEnter}>
            {renderTab()}
          </Animated.View>
        </View>
      </ScrollView>

      <ProfileSidebar
        visible={openProfile}
        onClose={() => setOpenProfile(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
  screenHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    centerFill: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 18,
      backgroundColor: colors.surface,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
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
    sheet: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 48,
      minHeight: screenHeight * 0.62,
      overflow: "hidden",
    },
  });

export default Home;
