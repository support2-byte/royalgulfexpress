import { api } from "@/api";
import Header from "@/components/ui/Header";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  { key: "all", label: "ALL" },
  { key: "paid", label: "PAID" },
  { key: "unpaid", label: "UNPAID" },
];

function mapInvoiceRow(row: InvoiceRow): InvoiceItem {
  const normalizedStatus: InvoiceStatus =
    row.status?.toLowerCase().includes("paid") &&
    !row.status?.toLowerCase().includes("unpaid")
      ? "paid"
      : "unpaid";

  return {
    id: String(row.id),
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

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

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

  const renderItem = ({ item }: { item: InvoiceItem }) => {
    const isPaid = item.status === "paid";
    const isPaying = payingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.invoiceNumber}</Text>
            <View style={styles.typeRow}>
              {!!item.invoiceType && (
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{item.invoiceType}</Text>
                </View>
              )}
              {!!item.shipmentRef && (
                <Text style={styles.cardText} numberOfLines={1}>
                  {item.shipmentRef}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.statusChip,
              isPaid
                ? { backgroundColor: "#E8F5E9" }
                : { backgroundColor: "#FFF3E0" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isPaid ? "#16803C" : "#B4690E" },
              ]}
            />
            <Text
              style={[
                styles.chipText,
                { color: isPaid ? "#16803C" : "#B4690E" },
              ]}
            >
              {isPaid ? "Paid" : "Unpaid"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.metaLabel}>Date</Text>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.dateText}>
                {moment(item.date).format("MMM D, YYYY")}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Amount</Text>
            <Text style={styles.cardPrice}>
              {item.currency} {item.amount.toLocaleString()}
            </Text>
          </View>
        </View>

        {!isPaid && (
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
              <>
                <Ionicons name="card-outline" size={16} color="#fff" />
                <Text style={styles.payBtnText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Invoices"
        description="Track you all invoices"
        icon="receipt"
      />

      {totals.unpaidCount > 0 && (
        <View style={styles.summaryBar}>
          <Ionicons name="alert-circle-outline" size={16} color="#B4690E" />
          <Text style={styles.summaryText}>
            {totals.unpaidCount} unpaid invoice
            {totals.unpaidCount > 1 ? "s" : ""} · AED{" "}
            {totals.unpaidAmount.toLocaleString()} due
          </Text>
        </View>
      )}

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive && {
                    color: colors.primary,
                    fontFamily: fonts.semiBold,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadInvoices()}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="file-tray-outline"
            size={36}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No {activeTab === "all" ? "" : activeTab} invoices found
          </Text>
        </View>
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
    </SafeAreaView>
  );
}

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
    summaryBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginHorizontal: 16,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: "#FFF3E0",
    },
    summaryText: {
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.xs ?? 12,
      color: "#B4690E",
    },
    tabRow: {
      flexDirection: "row",
      marginTop: 12,
      borderBottomWidth: 1,
      borderColor: colors.borderColor,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
    },
    tabLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    tabIndicator: {
      marginTop: 8,
      height: 2,
      width: "60%",
      borderRadius: 1,
      backgroundColor: colors.primary,
      position: "absolute",
      bottom: -1,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 30,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 24,
      gap: 12,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    iconBubble: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: `${colors.primary}1A`,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
      marginBottom: 2,
    },
    cardText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    typeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    typeChip: {
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      backgroundColor: `${colors.primary}1A`,
    },
    typeChipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 11,
      color: colors.primary,
      textTransform: "capitalize",
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderColor,
      marginVertical: 12,
    },
    cardBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    metaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginBottom: 3,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    dateText: {
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    cardPrice: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg,
      color: colors.primary,
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 11,
    },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 14,
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: colors.secondary,
    },
    payBtnText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
  });
