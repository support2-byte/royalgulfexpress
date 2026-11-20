import { ls, tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import { RecentInvoice } from "@/types/home";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { EmptyState } from "./EmptyState";
import { RecentInvoiceCard } from "./RecentInvoice";

interface Props {
  invoices: RecentInvoice[];
}

export const InvoicesTab: React.FC<Props> = ({ invoices }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const unpaid = invoices.filter(
    (i) => (i.status || "").toLowerCase() !== "paid",
  );
  const unpaidTotal = unpaid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  if (invoices.length === 0) {
    return <EmptyState icon="receipt-outline" label="No invoices yet." />;
  }

  return (
    <View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {unpaid.length > 0 ? "Waiting for payment" : "Everything is paid"}
        </Text>
        <Text style={styles.summaryValue}>
          AED {unpaidTotal.toLocaleString()}
        </Text>
        <Text style={styles.summarySub}>
          {tr("{n} unpaid of {total}", { n: unpaid.length, total: invoices.length })}
        </Text>
      </View>

      {invoices.map((invoice, index) => (
        <RecentInvoiceCard
          key={invoice.id ?? index}
          invoice={invoice}
          index={index}
        />
      ))}
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    summary: {
      paddingBottom: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    summaryLabel: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 34,
      fontFamily: fonts.bold,
      color: colors.ink,
      letterSpacing: ls(-0.8),
      marginTop: 4,
    },
    summarySub: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.lightText,
      marginTop: 4,
    },
  });
