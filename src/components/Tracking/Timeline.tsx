import { tr } from "@/i18n";
import TrackingHistory from "@/components/Home/TrackingHistory";
import PartialShipments from "@/components/Tracking/PartialShipments";
import type { ShipmentPart } from "@/lib/tracking";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import moment from "moment";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";

export type StepStatus = "completed" | "active" | "pending";

export interface TrackingStep {
  title: string;
  date: string | null;
  status: StepStatus;
}

interface Props {
  steps: TrackingStep[];
  eta: string | null;
  styles?: unknown;
  /** Item split across several containers: show each part on its own. */
  partial?: { parts: ShipmentPart[]; steps: string[] } | null;
}

const Timeline: React.FC<Props> = ({ steps, eta, partial }) => {
  const { colors, fontSize, fonts } = useAppTheme();

  const history = steps
    .filter((s) => s.status !== "pending" && s.date)
    .map((s) => ({ status: s.title, time: s.date as string }));
  const remaining = steps.filter((s) => s.status === "pending").map((s) => s.title);
  const current = steps.find((s) => s.status === "active")?.title ?? "";

  const styles = StyleSheet.create({
    eta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      marginBottom: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    etaIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FEF1E6",
      alignItems: "center",
      justifyContent: "center",
    },
    etaLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    etaDate: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
      marginTop: 1,
    },
  });

  return (
    <View>
      {eta && (
        <Animated.View entering={FadeInDown.duration(380)} style={styles.eta}>
          <View style={styles.etaIcon}>
            <Ionicons name="time-outline" size={19} color={colors.secondary} />
          </View>
          <View>
            <Text style={styles.etaLabel}>{tr("Estimated arrival")}</Text>
            <Text style={styles.etaDate}>{moment(eta).format("dddd, D MMM YYYY")}</Text>
          </View>
        </Animated.View>
      )}
      {partial ? (
        <PartialShipments parts={partial.parts} steps={partial.steps} />
      ) : (
        <TrackingHistory history={history} remaining={remaining} current={current} />
      )}
    </View>
  );
};

export default Timeline;
