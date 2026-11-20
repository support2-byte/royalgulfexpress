import { tr } from "@/i18n";
import { LAYOUT } from "@/constants/motion";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, {
  Easing,
  FadeInLeft,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export interface HistoryEntry {
  status: string;
  time: string;
}

interface Props {
  history: HistoryEntry[];
  remaining: string[];
  current: string;
}

type StepState = "done" | "active" | "pending";

interface Step {
  title: string;
  time: string | null;
  state: StepState;
}

const TERMINAL = ["Rejected", "Cancelled"];

const ICONS: Record<string, string> = {
  Created: "document-text-outline",
  "Ready for Loading": "cube-outline",
  "Loaded into Container": "archive-outline",
  "Shipment Processing": "sync-outline",
  "Under Processing": "hourglass-outline",
  "Shipment In Transit": "boat-outline",
  "Arrived at Sort Facility": "business-outline",
  "Ready for Delivery": "bicycle-outline",
  "Shipment Delivered": "checkmark-done-outline",
  Rejected: "close-circle-outline",
  Cancelled: "ban-outline",
};

const STEP_DELAY = 190;

const StepRow = ({
  step,
  index,
  isLast,
  nextState,
}: {
  step: Step;
  index: number;
  isLast: boolean;
  nextState: StepState | null;
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const lineFill = useSharedValue(0);
  const nodeScale = useSharedValue(0);
  const pulse = useSharedValue(0);

  const base = index * STEP_DELAY;
  const failed = TERMINAL.includes(step.title);
  const accent = failed
    ? colors.error
    : step.state === "active"
      ? colors.secondary
      : colors.primary;

  useEffect(() => {
    nodeScale.value = withDelay(
      base,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
    if (step.state === "done") {
      lineFill.value = withDelay(
        base + 120,
        withTiming(1, { duration: STEP_DELAY, easing: Easing.out(Easing.quad) }),
      );
    }
    if (step.state === "active" && nextState === "pending") {
      lineFill.value = withDelay(
        base + 120,
        withTiming(0.28, { duration: 500, easing: Easing.out(Easing.quad) }),
      );
    }
    if (step.state === "active") {
      pulse.value = withDelay(
        base + 300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
        ),
      );
    }
  }, [step.state]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nodeScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    height: `${lineFill.value * 100}%`,
  }));

  const pending = step.state === "pending";
  const icon = ICONS[step.title] ?? "ellipse-outline";

  return (
    <Animated.View
      entering={FadeInLeft.duration(380).delay(base)}
      style={styles.row}
    >
      <View style={styles.rail}>
        <Animated.View style={[styles.nodeWrap, nodeStyle]}>
          {step.state === "active" && (
            <Animated.View
              style={[styles.halo, { backgroundColor: accent }, haloStyle]}
            />
          )}
          <View
            style={[
              styles.node,
              pending
                ? styles.nodePending
                : { backgroundColor: accent, borderColor: accent },
            ]}
          >
            {step.state === "done" && !failed ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Ionicons
                name={icon as any}
                size={13}
                color={pending ? colors.lightText : "#fff"}
              />
            )}
          </View>
        </Animated.View>
        {!isLast && (
          <View
            style={[
              styles.track,
              pending && styles.trackPending,
            ]}
          >
            <Animated.View
              style={[styles.fill, { backgroundColor: accent }, fillStyle]}
            />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, pending && styles.titlePending]}
            numberOfLines={2}
          >
            {step.title}
          </Text>
          {step.state === "active" && (
            <View style={[styles.nowTag, { backgroundColor: accent }]}>
              <Text style={styles.nowText}>{failed ? "Final" : "Now"}</Text>
            </View>
          )}
        </View>
        {step.time ? (
          <Text style={styles.time}>
            {moment(step.time).format("D MMM YYYY, h:mm A")}
            {step.state === "active"
              ? `  ·  ${moment(step.time).fromNow()}`
              : ""}
          </Text>
        ) : (
          <Text style={styles.timePending}>{tr("Upcoming")}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const TrackingHistory: React.FC<Props> = ({ history, remaining, current }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const [open, setOpen] = useState(true);

  const steps = useMemo<Step[]>(() => {
    const asc = [...history].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
    const done: Step[] = asc.map((h) => ({
      title: h.status,
      time: h.time,
      state: "done",
    }));
    if (done.length > 0) done[done.length - 1].state = "active";

    const isTerminal = TERMINAL.includes(current);
    const doneTitles = new Set(done.map((d) => d.title));
    const upcoming: Step[] = remaining
      .filter((s) => !doneTitles.has(s))
      .filter((s) =>
        TERMINAL.includes(s) ? isTerminal && s === current : true,
      )
      .map((s) => ({ title: s, time: null, state: "pending" as const }));

    return [...done, ...upcoming];
  }, [history, remaining, current]);

  const completed = steps.filter((s) => s.state !== "pending").length;
  const ratio = steps.length ? completed / steps.length : 0;

  const bar = useSharedValue(0);
  const chevron = useSharedValue(0);

  useEffect(() => {
    bar.value = withDelay(
      200,
      withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [ratio]);

  useEffect(() => {
    chevron.value = withTiming(open ? 1 : 0, { duration: 250 });
  }, [open]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${bar.value * 100}%`,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  if (steps.length === 0) return null;

  return (
    <Animated.View
      layout={LAYOUT}
      style={styles.wrap}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{tr("Tracking history")}</Text>
          <Text style={styles.headerSub}>
            {tr("{done} of {total} steps reached", { done: completed, total: steps.length })}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>

      {open && (
        <Animated.View exiting={FadeOutUp.duration(200)} style={styles.list}>
          {steps.map((step, index) => (
            <StepRow
              key={`${step.title}-${index}`}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
              nextState={steps[index + 1]?.state ?? null}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    wrap: {
      marginBottom: 18,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    headerSub: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    barTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.dome,
      overflow: "hidden",
      marginBottom: 18,
    },
    barFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    list: {
      paddingLeft: 2,
    },
    row: {
      flexDirection: "row",
      gap: 14,
      minHeight: 62,
    },
    rail: {
      alignItems: "center",
      width: 28,
    },
    nodeWrap: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    halo: {
      position: "absolute",
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    node: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    nodePending: {
      backgroundColor: colors.surface,
      borderColor: colors.borderColor,
      borderStyle: "dashed",
    },
    track: {
      flex: 1,
      width: 2,
      marginVertical: 3,
      borderRadius: 1,
      backgroundColor: colors.dome,
      overflow: "hidden",
    },
    trackPending: {
      backgroundColor: colors.hairline,
    },
    fill: {
      width: "100%",
    },
    body: {
      flex: 1,
      paddingBottom: 14,
      paddingTop: 3,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      flexShrink: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    titlePending: {
      fontFamily: fonts.medium,
      color: colors.lightText,
    },
    nowTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    nowText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: "#fff",
    },
    time: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 3,
    },
    timePending: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.lightText,
      marginTop: 3,
    },
  });

export default TrackingHistory;
