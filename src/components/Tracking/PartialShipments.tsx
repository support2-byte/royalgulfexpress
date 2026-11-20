import { LAYOUT } from "@/constants/motion";
import { DefaultStatusStyle, ShipmentStatus } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ls, tr } from "@/i18n";
import type { ShipmentPart } from "@/lib/tracking";
import Ionicons from "@react-native-vector-icons/ionicons";
import moment from "moment";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";

interface Props {
  parts: ShipmentPart[];
  steps: string[];
}

type Tone = { bg: string; text: string; dot: string };

const toneOf = (status: string): Tone =>
  (ShipmentStatus as Record<string, Tone>)[status] ?? DefaultStatusStyle;

const StepBar = ({ part, steps }: { part: ShipmentPart; steps: string[] }) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stepBar}>
      {steps.map((s, k) => {
        const done = k < part.idx || (part.delivered && k === part.idx);
        const current = k === part.idx && !part.delivered;
        return (
          <Animated.View
            key={s}
            entering={FadeIn.duration(300).delay(Math.min(k, 12) * 30)}
            style={[
              styles.segment,
              {
                backgroundColor: done
                  ? part.delivered
                    ? colors.success
                    : colors.primary
                  : current
                    ? colors.secondary
                    : colors.dome,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const PartRow = ({
  part,
  n,
  total,
  steps,
  isLast,
}: {
  part: ShipmentPart;
  n: number;
  total: number;
  steps: string[];
  isLast: boolean;
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const [open, setOpen] = useState(false);
  const tone = toneOf(part.status);
  const next = part.delivered ? null : steps[part.idx + 1];

  const s = {
    title: {
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    container: { fontFamily: fonts.semiBold, color: colors.primary },
    meta: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 3,
    },
    status: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: tone.text },
    caption: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    captionStrong: { fontFamily: fonts.semiBold, color: colors.ink },
    toggle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs,
      color: colors.secondary,
    },
    updateStatus: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    updateTime: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
  };

  const meta = [
    `${part.qty.toLocaleString()} ${tr("pkgs")}`,
    part.weight > 0 ? `${part.weight.toLocaleString()} kg` : null,
    !part.delivered && part.eta
      ? `${tr("ETA")} ${moment(part.eta).format("D MMM YYYY")}`
      : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Animated.View
      entering={FadeInDown.duration(340).delay(Math.min(n, 5) * 60)}
      layout={LAYOUT}
      style={[
        styles.row,
        {
          borderBottomColor: colors.hairline,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.topLine}>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>
            {tr("Shipment {n} of {total}", { n: n + 1, total })}
            {!!part.container && (
              <Text style={s.container}>{`  ·  ${part.container}`}</Text>
            )}
          </Text>
          <Text style={s.meta}>{meta}</Text>
        </View>
        <View style={styles.statusWrap}>
          <View style={[styles.dot, { backgroundColor: tone.dot }]} />
          <Text style={s.status} numberOfLines={1}>
            {tr(part.status)}
          </Text>
        </View>
      </View>

      <StepBar part={part} steps={steps} />

      <View style={styles.captionRow}>
        <Text style={s.caption} numberOfLines={1}>
          <Text style={s.captionStrong}>
            {tr("Step {n} of {total}", { n: part.idx + 1, total: steps.length })}
          </Text>
        </Text>
        {!!next && (
          <Text style={[s.caption, { flexShrink: 1 }]} numberOfLines={1}>
            {tr("Next: {step}", { step: tr(next) })}
          </Text>
        )}
      </View>

      {part.history.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setOpen((o) => !o)}
            activeOpacity={0.6}
            hitSlop={8}
            style={styles.toggle}
          >
            <Text style={s.toggle}>
              {open
                ? tr("Hide updates ({n})", { n: part.history.length })
                : tr("Show updates ({n})", { n: part.history.length })}
            </Text>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.secondary}
            />
          </TouchableOpacity>

          {open && (
            <Animated.View
              entering={FadeInDown.duration(240)}
              exiting={FadeOutUp.duration(160)}
              style={{ marginTop: 10 }}
            >
              {part.history.map((h, i) => {
                const latest = i === part.history.length - 1;
                return (
                  <View key={`${h.status}-${i}`} style={styles.update}>
                    <View
                      style={[
                        styles.updateDot,
                        {
                          backgroundColor: latest
                            ? colors.secondary
                            : colors.primary,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.updateStatus}>{tr(h.status)}</Text>
                      <Text style={s.updateTime}>
                        {moment(h.time).format("D MMM YYYY, h:mm A")}
                        {h.eta
                          ? `  ·  ${tr("ETA")} ${moment(h.eta).format("D MMM YYYY")}`
                          : ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}
        </>
      )}
    </Animated.View>
  );
};

/**
 * One item travelling in several containers. Each part gets its own progress
 * so the customer can see exactly which boxes are where.
 */
const PartialShipments: React.FC<Props> = ({ parts, steps }) => {
  const { colors, fontSize, fonts } = useAppTheme();
  if (parts.length < 2) return null;

  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ marginBottom: 6 }}>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: fontSize.md,
            color: colors.ink,
            letterSpacing: ls(-0.2),
          }}
        >
          {tr("Shipped in {n} parts", { n: parts.length })}
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: fontSize.xs,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          {tr("Each part travels in its own container and is tracked separately.")}
        </Text>
      </View>

      {parts.map((part, n) => (
        <PartRow
          key={`${part.container ?? "part"}-${n}`}
          part={part}
          n={n}
          total={parts.length}
          steps={steps}
          isLast={n === parts.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { paddingVertical: 16 },
  topLine: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "42%",
    paddingTop: 2,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  stepBar: { flexDirection: "row", gap: 4, marginTop: 14, marginBottom: 10 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  update: { flexDirection: "row", gap: 12, marginBottom: 10 },
  updateDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
});

export default PartialShipments;
