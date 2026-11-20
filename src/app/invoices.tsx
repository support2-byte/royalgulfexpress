import { tr } from "@/i18n";
import { api } from "@/api";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { PillTabs } from "@/components/ui/PillTabs";
import { StateView } from "@/components/ui/StateView";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useFocusEffect } from "expo-router";
import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type InvoiceStatus = "paid" | "unpaid";
type TabKey = "all" | "paid" | "unpaid";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  shipmentRef: string;
  date: string;
  currency: string;
  amount: number;
  status: InvoiceStatus;
}

interface InvoiceRow {
  id: number | string;
  public_ref: string;
  invoice_id: string;
  invoice_type: string;
  amount: number | string;
  status: string;
  created_at: string;
  due_at: string;
  shipment_id: string;
  customer_id: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
];

function mapInvoiceRow(row: InvoiceRow): InvoiceItem {
  const normalizedStatus: InvoiceStatus =
    row.status?.toLowerCase().includes("paid") &&
    !row.status?.toLowerCase().includes("unpaid")
      ? "paid"
      : "unpaid";

  return {
    id: row.public_ref,
    invoiceNumber: row.invoice_id,
    invoiceType: row.invoice_type ?? "",
    shipmentRef: row.shipment_id ?? "",
    date: row.due_at ?? row.created_at ?? new Date().toISOString(),
    currency: "AED",
    amount: Number(row.amount) || 0,
    status: normalizedStatus,
  };
}

async function fetchInvoices(
  receiverId: string | number,
): Promise<InvoiceItem[]> {
  try {
    const { data } = await api.get(`/invoices/${receiverId}`);

    if (!data?.success) {
      return [];
    }

    const rows: InvoiceRow[] = data.data ?? [];
    return rows.map(mapInvoiceRow);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export default function Invoices() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadInvoices = useCallback(
    async (isRefresh = false) => {
      if (!user?.customer_id) return;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const data = await fetchInvoices(user.customer_id);

        setInvoices(data);
      } catch (err) {
        setError("Couldn't load invoices. Pull down to try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.customer_id],
  );

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const handleRefresh = useCallback(() => {
    loadInvoices(true);
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    if (activeTab === "all") return invoices;
    return invoices.filter((inv) => inv.status === activeTab);
  }, [invoices, activeTab]);

  const totals = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === "unpaid");
    const unpaidAmount = unpaid.reduce((sum, i) => sum + i.amount, 0);
    return { unpaidCount: unpaid.length, unpaidAmount };
  }, [invoices]);

  const tabsWithCount = useMemo(
    () =>
      TABS.map((t) => ({
        ...t,
        count:
          t.key === "all"
            ? invoices.length
            : invoices.filter((i) => i.status === t.key).length,
      })),
    [invoices],
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: InvoiceItem;
    index: number;
  }) => {
    const isPaid = item.status === "paid";
    const isPaying = payingId === item.id;

    return (
      <Animated.View
        entering={FadeInDown.duration(320).delay(Math.min(index, 7) * 45)}
        style={styles.row}
      >
        <View style={styles.rowMain}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.invoiceNumber}
          </Text>
          <Text style={styles.cardText} numberOfLines={1}>
            {[item.invoiceType, item.shipmentRef]
              .filter(Boolean)
              .join("  ·  ") || "Invoice"}
          </Text>
          <Text style={styles.dateText}>
            Due {moment(item.date).format("D MMM YYYY")}
          </Text>
        </View>

        <View style={styles.rowSide}>
          <Text style={styles.cardPrice}>
            {item.currency} {item.amount.toLocaleString()}
          </Text>
          {isPaid ? (
            <View style={styles.paidRow}>
              <View
                style={[styles.statusDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.chipText, { color: colors.success }]}>
                {tr("Paid")}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.payBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.navigate({
                  pathname: "/pay-invoice",
                  params: { invoiceId: item.id },
                })
              }
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>{tr("Pay now")}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Invoices"
        description={
          totals.unpaidCount > 0
            ? tr(totals.unpaidCount > 1 ? "AED {amount} waiting across {n} invoices" : "AED {amount} waiting across {n} invoice", { amount: totals.unpaidAmount.toLocaleString(), n: totals.unpaidCount })
            : "Every bill and payment in one place"
        }
        icon="receipt"
      />

      <View style={sheet}>
        <View style={styles.tabsWrap}>
          <PillTabs
            tabs={tabsWithCount}
            active={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {loading ? (
          <StateView loading />
        ) : error ? (
          <StateView
            icon="cloud-offline-outline"
            label={error}
            actionLabel={tr("Retry")}
            onAction={() => loadInvoices()}
          />
        ) : filteredInvoices.length === 0 ? (
          <StateView
            icon="receipt-outline"
            label={activeTab === "all" ? tr("No invoices found") : activeTab === "paid" ? tr("No paid invoices found") : tr("No unpaid invoices found")}
          />
        ) : (
          <FlatList
            data={filteredInvoices}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    tabsWrap: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 6,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 40,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    rowMain: {
      flex: 1,
    },
    rowSide: {
      alignItems: "flex-end",
      gap: 8,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    cardText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 3,
      textTransform: "capitalize",
    },
    dateText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      marginTop: 2,
    },
    cardPrice: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    paidRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    chipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs,
    },
    payBtn: {
      paddingHorizontal: 16,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    payBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs,
      color: "#fff",
    },
  });
