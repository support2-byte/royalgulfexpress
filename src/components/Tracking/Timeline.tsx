import { createStyles } from "@/app/tracking";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type StepStatus = "completed" | "active" | "pending";

export interface TrackingStep {
  title: string;
  date: string | null;
  status: StepStatus;
}

const STATUS_META: Record<
  string,
  { icon: string; colorKey: "secondary" | "primary" | "lightPrimary" | "error" }
> = {
  Created: { icon: "document-text-outline", colorKey: "secondary" },
  "Ready for Loading": { icon: "cube-outline", colorKey: "secondary" },
  "Loaded into Container": { icon: "archive-outline", colorKey: "secondary" },
  "Shipment Processing": { icon: "sync-outline", colorKey: "secondary" },
  "Under Processing": { icon: "hourglass-outline", colorKey: "secondary" },
  "Shipment In Transit": { icon: "boat-outline", colorKey: "secondary" },
  "Arrived at Sort Facility": {
    icon: "business-outline",
    colorKey: "secondary",
  },
  "Ready for Delivery": {
    icon: "checkmark-done-outline",
    colorKey: "lightPrimary",
  },
  "Shipment Delivered": {
    icon: "checkmark-circle-outline",
    colorKey: "primary",
  },
  Rejected: { icon: "close-circle-outline", colorKey: "error" },
  Cancelled: { icon: "ban-outline", colorKey: "error" },
};

function statusMeta(title: string) {
  return (
    STATUS_META[title] ?? {
      icon: "ellipse-outline",
      colorKey: "secondary" as const,
    }
  );
}

interface TimelineProps {
  steps: TrackingStep[];
  eta: string | null;
  styles: ReturnType<typeof createStyles>;
}

export default function Timeline({ steps, eta, styles }: TimelineProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Shipment Progress</Text>

      <View style={styles.timelineWrap}>
        {steps.map((step, index) => (
          <TimelineStep
            key={`${step.title}-${index}`}
            step={step}
            isLast={index === steps.length - 1}
            index={index}
            styles={styles}
          />
        ))}
      </View>

      {eta && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(steps.length * 150 + 200)}
          style={styles.etaCard}
        >
          <Ionicons name="calendar-outline" size={22} color="#0d6c6a" />
          <View style={{ flex: 1 }}>
            <Text style={styles.etaLabel}>Estimated Delivery</Text>
            <Text style={styles.etaDate}>
              {new Date(eta).toLocaleDateString(undefined, {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
        </Animated.View>
      )}
    </>
  );
}

function TimelineStep({
  step,
  isLast,
  index,
  styles,
}: {
  step: TrackingStep;
  isLast: boolean;
  index: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const { colors } = useAppTheme();
  const lineProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  const baseDelay = index * 150;
  const meta = statusMeta(step.title);
  const isCompleted = step.status === "completed";
  const isActive = step.status === "active";
  const dotColor = isCompleted || isActive ? colors[meta.colorKey] : undefined;

  useEffect(() => {
    if (step.status !== "pending") {
      lineProgress.value = withDelay(
        baseDelay + 200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
      );
    }

    if (step.status === "active") {
      pulseScale.value = withDelay(
        baseDelay + 400,
        withRepeat(
          withSequence(
            withTiming(1.8, { duration: 900, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 0 }),
          ),
          -1,
          false,
        ),
      );
      pulseOpacity.value = withDelay(
        baseDelay + 400,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
            withTiming(0.6, { duration: 0 }),
          ),
          -1,
          false,
        ),
      );
    }
  }, [step.status]);

  const lineStyle = useAnimatedStyle(() => ({
    height: `${lineProgress.value * 100}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(baseDelay)}
      style={styles.stepRow}
    >
      <View style={styles.dotColumn}>
        <View
          style={[
            styles.dotOuter,
            dotColor && { backgroundColor: dotColor, borderColor: dotColor },
          ]}
        >
          {isActive && (
            <Animated.View
              style={[
                styles.pulseRing,
                { backgroundColor: dotColor },
                pulseStyle,
              ]}
            />
          )}
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="#fff" />
          ) : isActive ? (
            <Ionicons name={meta.icon as any} size={13} color="#fff" />
          ) : (
            <Ionicons
              name={meta.icon as any}
              size={12}
              color={colors.textSecondary}
            />
          )}
        </View>
        {!isLast && (
          <View style={styles.lineTrack}>
            <Animated.View
              style={[
                styles.lineFill,
                { backgroundColor: dotColor },
                lineStyle,
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepTitle,
            step.status === "pending" && styles.stepTitlePending,
          ]}
        >
          {step.title}
        </Text>
        {step.date ? (
          <Text style={styles.stepDate}>
            {new Date(step.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : (
          <Text style={styles.stepDatePending}>Pending</Text>
        )}
      </View>
    </Animated.View>
  );
}
