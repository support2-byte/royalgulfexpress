import { ls, tr } from "@/i18n";
import { api } from "@/api";
import { Button } from "@/components/ui/Button";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { StateView } from "@/components/ui/StateView";
import { useAppTheme } from "@/hooks/useAppTheme";
import { createNgeniusOrder } from "@/lib/paymentService";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type InvoiceStatus = "paid" | "unpaid";

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
    id: invoice.public_ref,
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
  const sheet = useSheetStyle();
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

  useFocusEffect(
    useCallback(() => {
      loadInvoice();
    }, [loadInvoice]),
  );

  const handlePay = async () => {
    if (!invoice) return;

    setPaying(true);
    try {
      const { paymentUrl, orderReferenceId } = await createNgeniusOrder(
        invoice.id,
      );
      router.push({
        pathname: "/pay-webview",
        params: { paymentUrl, orderReferenceId },
      });
    } catch (err: any) {
      Alert.alert("Payment Failed", "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const headerEl = (
    <Header
      name="Pay invoice"
      description={tr("Secure payment via N-Genius")}
      icon="card"
    />
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        {headerEl}
        <View style={sheet}>
          <StateView loading />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        {headerEl}
        <View style={sheet}>
          <StateView
            icon="cloud-offline-outline"
            label={error ?? "Invoice not found."}
            actionLabel={tr("Retry")}
            onAction={loadInvoice}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isStorage = invoice.invoiceType?.toLowerCase() === "storage";
  const isPaid = invoice.status === "paid";

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {headerEl}

      <View style={sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
        >
          <Animated.View
            entering={FadeInDown.duration(380)}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>
              {isPaid ? "Amount paid" : "Amount due"}
            </Text>
            <Text style={styles.heroAmount}>
              <Text style={styles.heroCurrency}>{invoice.currency} </Text>
              {invoice.amount.toLocaleString()}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isPaid ? colors.success : colors.secondary,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isPaid ? colors.success : colors.secondary },
                ]}
              >
                {isPaid ? "Paid" : "Waiting for payment"}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(380).delay(90)}
            style={styles.details}
          >
            <View style={styles.row}>
              <Text style={styles.metaLabel}>{tr("Invoice")}</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
            </View>
            {!!invoice.invoiceType && (
              <View style={styles.row}>
                <Text style={styles.metaLabel}>{tr("Type")}</Text>
                <Text
                  style={[styles.metaValue, { textTransform: "capitalize" }]}
                >
                  {invoice.invoiceType}
                </Text>
              </View>
            )}
            {!!invoice.shipmentRef && (
              <View style={styles.row}>
                <Text style={styles.metaLabel}>{tr("Shipment")}</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {invoice.shipmentRef}
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.metaLabel}>{tr("Due date")}</Text>
              <Text style={styles.metaValue}>
                {moment(invoice.date).format("D MMM YYYY")}
              </Text>
            </View>
            {isStorage && invoice.storageDays !== undefined && (
              <View style={styles.row}>
                <Text style={styles.metaLabel}>{tr("Storage duration")}</Text>
                <Text style={styles.metaValue}>
                  {invoice.storageDays} day
                  {invoice.storageDays === 1 ? "" : "s"}
                </Text>
              </View>
            )}
            {isStorage && invoice.storageAmount !== undefined && (
              <View style={styles.row}>
                <Text style={styles.metaLabel}>{tr("Storage")}</Text>
                <Text style={styles.metaValue}>
                  {invoice.storageAmount.toLocaleString()}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(380).delay(170)}
            style={styles.secureNote}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.secureNoteText}>
              {tr("Payments are processed securely by N-Genius. Card details never touch our servers.")}
            </Text>
          </Animated.View>
        </ScrollView>

        {!isPaid && (
          <Animated.View
            entering={FadeInDown.duration(380).delay(240)}
            style={styles.footer}
          >
            <Button
              label={tr("Pay {amount}", { amount: `${invoice.currency} ${invoice.amount.toLocaleString()}` })}
              icon="lock-closed"
              variant="accent"
              loading={paying}
              onPress={handlePay}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    bodyContainer: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
    hero: { paddingBottom: 24 },
    heroLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    heroAmount: {
      fontFamily: fonts.bold,
      fontSize: 44,
      lineHeight: 52,
      color: colors.ink,
      letterSpacing: ls(-1.2),
      marginTop: 4,
    },
    heroCurrency: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg,
      color: colors.lightText,
      letterSpacing: ls(0),
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 8,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: fonts.semiBold, fontSize: fontSize.sm },
    details: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    metaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    metaValue: {
      flexShrink: 1,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    secureNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 24,
    },
    secureNoteText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
  });
