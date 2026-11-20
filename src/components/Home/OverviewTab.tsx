import { ls, tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DashboardData, RecentOrder } from "@/types/home";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { EmptyState } from "./EmptyState";
import LatestShipmentCard from "./LatestShipmentCard";
import { RecentShipmentCard } from "./RecentShipment";
import { SectionHeader } from "./SectionHeader";

interface Props {
  data: DashboardData | null;
  orders: RecentOrder[];
  onSeeShipments: () => void;
}

export const OverviewTab: React.FC<Props> = ({
  data,
  orders,
  onSeeShipments,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const latest = orders[0] ?? null;
  const nextUp = orders.slice(1, 4);
  const unpaid = (data?.recent_invoices ?? []).filter(
    (i) => (i.status || "").toLowerCase() !== "paid",
  );
  const unpaidCount = data?.unpaid_count ?? unpaid.length;
  const unpaidTotal =
    data?.unpaid_total ??
    unpaid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const firstUnpaid = unpaid[0];

  return (
    <View>
      {latest ? (
        <Animated.View entering={FadeInDown.duration(380)}>
          <LatestShipmentCard order={latest} />
        </Animated.View>
      ) : (
        <EmptyState label="Your first shipment will appear here." />
      )}

      <Animated.View
        entering={FadeInDown.duration(380).delay(80)}
        style={styles.stats}
      >
        <View style={styles.stat}>
          <Text style={styles.statValue}>{data?.total_orders ?? 0}</Text>
          <Text style={styles.statLabel}>{tr("Shipments")}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{data?.total_invoices ?? 0}</Text>
          <Text style={styles.statLabel}>{tr("Invoices")}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              unpaidCount > 0 && { color: colors.secondary },
            ]}
          >
            {unpaidCount}
          </Text>
          <Text style={styles.statLabel}>{tr("Unpaid")}</Text>
        </View>
      </Animated.View>

      {firstUnpaid && (
        <Animated.View entering={FadeInDown.duration(380).delay(140)}>
          <TouchableOpacity
            style={styles.dueRow}
            activeOpacity={0.7}
            onPress={() =>
              router.navigate({
                pathname: "/pay-invoice",
                params: { invoiceId: firstUnpaid.id },
              })
            }
          >
            <View style={styles.dueIcon}>
              <Ionicons name="card-outline" size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dueTitle}>
                AED {unpaidTotal.toLocaleString()} waiting for payment
              </Text>
              <Text style={styles.dueSub}>
                {firstUnpaid.due_at
                  ? tr("{id} is due {when}", { id: firstUnpaid.invoice_id, when: moment(firstUnpaid.due_at).fromNow() })
                  : firstUnpaid.invoice_id}
              </Text>
            </View>
            <Text style={styles.dueAction}>{tr("Pay")}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {nextUp.length > 0 && (
        <>
          <SectionHeader
            title={tr("Earlier shipments")}
            actionLabel={tr("See all")}
            onAction={onSeeShipments}
          />
          {nextUp.map((order, index) => (
            <RecentShipmentCard
              key={`${order.rgl_booking_number}-${index}`}
              order={order}
              index={index}
            />
          ))}
        </>
      )}
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    stats: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 22,
    },
    stat: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: fontSize.xl,
      fontFamily: fonts.bold,
      color: colors.ink,
      letterSpacing: ls(-0.4),
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: colors.borderColor,
    },
    dueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    dueIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FEF1E6",
      alignItems: "center",
      justifyContent: "center",
    },
    dueTitle: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.ink,
    },
    dueSub: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dueAction: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.secondary,
    },
  });
