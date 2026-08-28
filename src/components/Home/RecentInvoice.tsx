import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface RecentInvoice {
  id: number;
  invoice_id: string;
  created_at: string;
  due_at: string | null;
  status: "paid" | "unpaid" | string;
  amount: number;
}

interface Props {
  invoice: RecentInvoice;
  index: number;
}

export const RecentInvoiceCard: React.FC<Props> = ({ invoice, index }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const isPaid = (invoice.status || "").toLowerCase() === "paid";
  const issuedLabel = invoice.created_at
    ? moment(invoice.created_at).format("DD-MMM-YYYY")
    : "—";
  const dueLabel = invoice.due_at
    ? moment(invoice.due_at).format("DD-MMM-YYYY")
    : "—";
  const amount =
    typeof invoice.amount === "number"
      ? invoice.amount
      : Number(invoice.amount) || 0;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(240 + index * 70)}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.invoiceId}>{invoice.invoice_id ?? "—"}</Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isPaid ? colors.primary : "#0d6c6a" },
            ]}
          >
            <Text style={styles.statusText}>{isPaid ? "PAID" : "UNPAID"}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.dateText}>Issued Date: {issuedLabel}</Text>
            <Text style={styles.dateText}>Due Date: {dueLabel}</Text>
          </View>
          <Text style={styles.amount}>AED {amount.toLocaleString()}</Text>
        </View>
        {!isPaid && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() =>
              router.navigate({
                pathname: "/pay-invoice",
                params: { invoiceId: invoice.id },
              })
            }
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.lightGrey,
      marginBottom: 10,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    invoiceId: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      fontSize: fontSize.xs ?? 10,
      fontFamily: fonts.semiBold,
      color: colors.background,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    dateText: {
      fontSize: fontSize.xs ?? fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    amount: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.secondary,
    },
    payButton: {
      marginTop: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    payButtonText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.background,
    },
  });
