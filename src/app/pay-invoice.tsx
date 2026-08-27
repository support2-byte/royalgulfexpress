import { api } from "@/api";
import Header from "@/components/ui/Header";
import { useAppTheme } from "@/hooks/useAppTheme";
// import { createNgeniusOrder, payWithCard } from "@/services/paymentService";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type InvoiceStatus = "paid" | "unpaid";

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

interface StorageDetails {
  id: number | string;
  customer_id: string;
  shipment: string;
  storage: number | string;
  days: number | string;
  amount: number | string;
  status: string;
  created_at: string;
}

interface DeliveryDetails {
  id: number | string;
  customer_id: string;
  shipment: string;
  amount: number | string;
  status: string;
  created_at: string;
}

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  shipmentRef: string;
  date: string;
  currency: string;
  amount: number;
  status: InvoiceStatus;
  storageDays?: number;
  storageAmount?: number;
}

function mapDetails(
  invoice: InvoiceRow,
  extra: StorageDetails | DeliveryDetails | null,
): InvoiceDetails {
  const normalizedStatus: InvoiceStatus =
    invoice.status?.toLowerCase().includes("paid") &&
    !invoice.status?.toLowerCase().includes("unpaid")
      ? "paid"
      : "unpaid";

  const isStorage = invoice.invoice_type?.toLowerCase() === "storage";
  const storageExtra = isStorage ? (extra as StorageDetails | null) : null;

  return {
    id: String(invoice.id),
    invoiceNumber: invoice.invoice_id,
    invoiceType: invoice.invoice_type ?? "",
    shipmentRef: extra?.shipment ?? "",
    date: invoice.due_at ?? invoice.created_at ?? new Date().toISOString(),
    currency: "AED",
    amount: Number(invoice.amount) || 0,
    status: normalizedStatus,
    storageDays: storageExtra ? Number(storageExtra.days) || 0 : undefined,
    storageAmount: storageExtra ? Number(storageExtra.storage) || 0 : undefined,
  };
}

async function fetchInvoiceDetails(invoiceId: string): Promise<InvoiceDetails> {
  const { data } = await api.get(`/invoices/details/${invoiceId}`);

  if (!data?.success) {
    throw new Error(data?.message ?? "Failed to load invoice.");
  }

  return mapDetails(data.data.invoice, data.data.details);
}

export default function PayInvoiceScreen() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvoiceDetails(invoiceId);
      setInvoice(data);
    } catch (err) {
      setError("Couldn't load invoice. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePay = async () => {
    if (!invoice) return;

    setPaying(true);
    try {
      //   const order = await createNgeniusOrder(invoice.id);
      //   const result = await payWithCard(order);
      let result: any;

      if (result?.status === "SUCCESS" || result?.state === "PURCHASED") {
        Alert.alert("Payment Successful", "Your invoice has been paid.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Payment Incomplete", "The payment was not completed.");
      }
    } catch (err: any) {
      if (err?.code === "USER_CANCELLED") {
      } else {
        Alert.alert(
          "Payment Failed",
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          name="Pay Invoice"
          description="Secure payment via N-Genius"
          icon="card"
        />
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          name="Pay Invoice"
          description="Secure payment via N-Genius"
          icon="card"
        />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error ?? "Invoice not found."}</Text>
          <TouchableOpacity onPress={loadInvoice} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isStorage = invoice.invoiceType?.toLowerCase() === "storage";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Pay Invoice"
        description="Secure payment via N-Genius"
        icon="card"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContainer}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconBubble}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <View style={styles.typeRow}>
                {!!invoice.invoiceType && (
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>
                      {invoice.invoiceType}
                    </Text>
                  </View>
                )}
                {!!invoice.shipmentRef && (
                  <Text style={styles.invoiceDesc} numberOfLines={1}>
                    {invoice.shipmentRef}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {moment(invoice.date).format("MMM D, YYYY")}
            </Text>
          </View>

          {isStorage && invoice.storageDays !== undefined && (
            <View style={styles.row}>
              <Text style={styles.metaLabel}>Storage Duration</Text>
              <Text style={styles.metaValue}>
                {invoice.storageDays} day{invoice.storageDays === 1 ? "" : "s"}
              </Text>
            </View>
          )}

          {isStorage && invoice.storageAmount !== undefined && (
            <View style={styles.row}>
              <Text style={styles.metaLabel}>Storage</Text>
              <Text style={styles.metaValue}>
                {invoice.storageAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Status</Text>
            <View
              style={[
                styles.statusChip,
                invoice.status === "paid"
                  ? { backgroundColor: "#E8F5E9" }
                  : { backgroundColor: "#FFF3E0" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      invoice.status === "paid" ? "#16803C" : "#B4690E",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusChipText,
                  { color: invoice.status === "paid" ? "#16803C" : "#B4690E" },
                ]}
              >
                {invoice.status === "paid" ? "Paid" : "Unpaid"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.amountLabel}>Amount Due</Text>
            <Text style={styles.amountValue}>
              {invoice.currency} {invoice.amount.toLocaleString()}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(350).delay(80)}
          style={styles.secureNote}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.secureNoteText}>
            Payments are processed securely by N-Genius. Card details never
            touch our servers.
          </Text>
        </Animated.View>
      </ScrollView>

      {invoice.status === "unpaid" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payBtn, paying && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handlePay}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={styles.payBtnText}>
                  Pay {invoice.currency} {invoice.amount.toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    container: { flex: 1, backgroundColor: colors.background },
    bodyContainer: { padding: 20, paddingBottom: 20 },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 30,
    },
    errorText: {
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
    card: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    iconBubble: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: `${colors.primary}1A`,
      alignItems: "center",
      justifyContent: "center",
    },
    invoiceNumber: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
      marginBottom: 4,
    },
    invoiceDesc: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    typeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
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
      marginVertical: 14,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    metaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    metaValue: {
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusChipText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 11,
    },
    amountLabel: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
    },
    amountValue: {
      fontFamily: fonts.bold,
      fontSize: fontSize.xl,
      color: colors.primary,
    },
    secureNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingHorizontal: 4,
    },
    secureNoteText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
    },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      paddingVertical: 15,
    },
    payBtnText: {
      color: "#fff",
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
    },
  });
