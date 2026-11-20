import { tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RecentInvoice } from "@/types/home";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Props {
  invoice: RecentInvoice;
  index: number;
}

export const RecentInvoiceCard: React.FC<Props> = ({ invoice, index }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const isPaid = (invoice.status || "").toLowerCase() === "paid";
  const issuedLabel = invoice.created_at
    ? moment(invoice.created_at).format("D MMM YYYY")
    : "—";
  const dueLabel = invoice.due_at
    ? moment(invoice.due_at).format("D MMM YYYY")
    : "—";
  const amount =
    typeof invoice.amount === "number"
      ? invoice.amount
      : Number(invoice.amount) || 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 45)}
      style={styles.row}
    >
      <View style={styles.main}>
        <Text style={styles.invoiceId} numberOfLines={1}>
          {invoice.invoice_id ?? "—"}
        </Text>
        <Text style={styles.meta}>Issued {issuedLabel}</Text>
        <Text style={styles.meta}>Due {dueLabel}</Text>
      </View>

      <View style={styles.side}>
        <Text style={styles.amount}>AED {amount.toLocaleString()}</Text>
        {isPaid ? (
          <View style={styles.paidRow}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.status, { color: colors.success }]}>{tr("Paid")}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.payButton}
            activeOpacity={0.8}
            onPress={() =>
              router.navigate({
                pathname: "/pay-invoice",
                params: { invoiceId: invoice.id },
              })
            }
          >
            <Text style={styles.payButtonText}>{tr("Pay now")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    main: {
      flex: 1,
    },
    invoiceId: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
      marginBottom: 3,
    },
    meta: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    side: {
      alignItems: "flex-end",
      gap: 8,
    },
    amount: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    paidRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    status: {
      fontSize: fontSize.xs,
      fontFamily: fonts.semiBold,
    },
    payButton: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    payButtonText: {
      fontSize: fontSize.xs,
      fontFamily: fonts.semiBold,
      color: "#fff",
    },
  });
