import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { tr } from "@/i18n";
import React, { useEffect, useMemo, useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** What the icon does when its tab becomes the active one. */
export type TabMotion = "rock" | "ring" | "pop" | "spin" | "bounce";

export interface WheelTabItem {
  key: string;
  label: string;
  icon: string;
  badge?: boolean;
  motion?: TabMotion;
}

interface Props {
  items: WheelTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

const SLOTS = 5;
const MAX_WIDTH = 560;
const SPRING = { damping: 24, stiffness: 210, mass: 0.9 };
const REVEAL_SPRING = { damping: 20, stiffness: 110, mass: 0.9 };

interface ItemProps {
  item: WheelTabItem;
  index: number;
  active: SharedValue<number>;
  reveal: SharedValue<number>;
  spacing: number;
  size: number;
  radius: number;
  width: number;
  onPress: () => void;
}

const WheelItem = ({
  item,
  index,
  active,
  reveal,
  spacing,
  size,
  radius,
  width,
  onPress,
}: ItemProps) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const step = spacing / radius;

  const wrapStyle = useAnimatedStyle(() => {
    const d = (index - active.value) * reveal.value;
    const a = Math.abs(index - active.value);
    const theta = d * step;
    return {
      opacity:
        interpolate(a, [0, 1, 2, 3], [1, 1, 0.8, 0], Extrapolation.CLAMP) *
        reveal.value,
      transform: [
        { translateX: Math.sin(theta) * radius },
        { translateY: (1 - Math.cos(theta)) * radius },
        {
          scale: interpolate(
            a,
            [0, 1, 2],
            [1.08, 0.86, 0.7],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const circleStyle = useAnimatedStyle(() => {
    const a = Math.abs(index - active.value);
    return {
      backgroundColor: interpolateColor(
        a,
        [0, 0.7],
        [colors.primary, "#FFFFFF"],
      ),
      shadowOpacity: interpolate(a, [0, 1], [0.28, 0.08], Extrapolation.CLAMP),
    };
  });

  const iconOnStyle = useAnimatedStyle(() => {
    const a = Math.abs(index - active.value);
    return { opacity: interpolate(a, [0, 0.7], [1, 0], Extrapolation.CLAMP) };
  });

  const iconOffStyle = useAnimatedStyle(() => {
    const a = Math.abs(index - active.value);
    return { opacity: interpolate(a, [0, 0.7], [0, 1], Extrapolation.CLAMP) };
  });

  const labelStyle = useAnimatedStyle(() => {
    const a = Math.abs(index - active.value);
    return {
      color: interpolateColor(a, [0, 0.7], [colors.ink, colors.lightText]),
    };
  });

  const underlineStyle = useAnimatedStyle(() => {
    const a = Math.abs(index - active.value);
    return {
      opacity: interpolate(a, [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scaleX: interpolate(a, [0, 0.6], [1, 0.2], Extrapolation.CLAMP) },
      ],
    };
  });

  const iconSize = Math.round(size * 0.42);

  // --- active-state icon motion -------------------------------------------
  const kind: TabMotion = item.motion ?? "pop";
  const motion = useSharedValue(0);

  useAnimatedReaction(
    () => Math.abs(index - active.value) < 0.5,
    (isActive, wasActive) => {
      if (isActive && !wasActive) {
        cancelAnimation(motion);
        if (kind === "rock") {
          motion.value = -1;
          motion.value = withRepeat(
            withTiming(1, {
              duration: 1100,
              easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true,
          );
        } else if (kind === "ring") {
          motion.value = 0;
          motion.value = withSequence(
            withTiming(1, { duration: 110 }),
            withTiming(-0.85, { duration: 130 }),
            withTiming(0.6, { duration: 130 }),
            withTiming(-0.35, { duration: 130 }),
            withTiming(0.15, { duration: 120 }),
            withTiming(0, { duration: 120 }),
          );
        } else if (kind === "spin") {
          motion.value = 0;
          motion.value = withSequence(
            withTiming(1, {
              duration: 520,
              easing: Easing.bezier(0.45, 0, 0.2, 1),
            }),
            withTiming(0, { duration: 0 }),
          );
        } else if (kind === "bounce") {
          motion.value = 0;
          motion.value = withSequence(
            withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 190, easing: Easing.in(Easing.cubic) }),
            withTiming(0.35, {
              duration: 110,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) }),
          );
        } else {
          motion.value = 0;
          motion.value = withSequence(
            withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
          );
        }
      } else if (!isActive && wasActive) {
        cancelAnimation(motion);
        motion.value = withTiming(0, { duration: 180 });
      }
    },
  );

  const iconMotionStyle = useAnimatedStyle(() => {
    const m = motion.value;
    if (kind === "rock") {
      return {
        transform: [{ rotate: `${m * 7}deg` }, { translateY: -Math.abs(m) * 1.5 }],
      };
    }
    if (kind === "ring") {
      return {
        transformOrigin: "50% 15%",
        transform: [{ rotate: `${m * 16}deg` }],
      };
    }
    if (kind === "spin") {
      return { transform: [{ rotate: `${m * 90}deg` }] };
    }
    if (kind === "bounce") {
      return { transform: [{ translateY: -m * 5 }, { scaleY: 1 - m * 0.06 }] };
    }
    return { transform: [{ scale: 1 + m * 0.22 }] };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 14,
          left: width / 2 - spacing / 2,
          width: spacing,
          alignItems: "center",
        },
        wrapStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        hitSlop={6}
        style={{ alignItems: "center" }}
        accessibilityRole="tab"
        accessibilityLabel={tr(item.label)}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primaryDeep,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 12,
              elevation: 4,
            },
            circleStyle,
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center" },
              iconMotionStyle,
            ]}
          >
            <Animated.View style={[{ position: "absolute" }, iconOnStyle]}>
              <Ionicons
                name={item.icon as any}
                size={iconSize}
                color="#FFFFFF"
              />
            </Animated.View>
            <Animated.View style={[{ position: "absolute" }, iconOffStyle]}>
              <Ionicons
                name={item.icon as any}
                size={iconSize}
                color={colors.primary}
              />
            </Animated.View>
          </Animated.View>
          {item.badge && (
            <View
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 11,
                height: 11,
                borderRadius: 6,
                backgroundColor: colors.secondary,
                borderWidth: 2,
                borderColor: colors.surface,
              }}
            />
          )}
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              marginTop: 9,
              fontSize: fontSize.xs,
              fontFamily: fonts.semiBold,
              maxWidth: spacing + 6,
            },
            labelStyle,
          ]}
        >
          {tr(item.label)}
        </Animated.Text>
        <Animated.View
          style={[
            {
              marginTop: 5,
              height: 3,
              width: 22,
              borderRadius: 2,
              backgroundColor: colors.secondary,
            },
            underlineStyle,
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const WheelTabs: React.FC<Props> = ({ items, activeKey, onChange }) => {
  const { colors } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const width = Math.min(screenWidth, MAX_WIDTH);
  const spacing = width / SLOTS;
  const size = Math.round(Math.min(64, Math.max(46, spacing * 0.78)));
  const radius = width * 0.8;
  const height = size + 80;

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.key === activeKey),
  );
  const active = useSharedValue(activeIndex);
  const reveal = useSharedValue(0);
  const indexRef = useRef(activeIndex);
  const baseRef = useRef(activeIndex);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  indexRef.current = activeIndex;

  useEffect(() => {
    reveal.value = withDelay(150, withSpring(1, REVEAL_SPRING));
  }, []);

  useEffect(() => {
    active.value = withSpring(activeIndex, SPRING);
  }, [activeIndex]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          baseRef.current = indexRef.current;
        },
        onPanResponderMove: (_, g) => {
          const next = baseRef.current - g.dx / spacing;
          active.value = Math.max(-0.35, Math.min(items.length - 0.65, next));
        },
        onPanResponderRelease: (_, g) => {
          const projected = baseRef.current - (g.dx + g.vx * 90) / spacing;
          const target = Math.max(
            0,
            Math.min(items.length - 1, Math.round(projected)),
          );
          active.value = withSpring(target, SPRING);
          if (target !== indexRef.current) {
            onChangeRef.current(items[target].key);
          }
        },
        onPanResponderTerminate: () => {
          active.value = withSpring(indexRef.current, SPRING);
        },
      }),
    [spacing, items],
  );

  const domeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(reveal.value, [0, 1], [0.8, 1]) }],
    opacity: reveal.value,
  }));

  return (
    <View
      style={{
        width: "100%",
        height,
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: colors.surface,
        direction: "ltr",
      }}
      {...panResponder.panHandlers}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: size / 2 + 4,
            width: screenWidth * 1.9,
            height: screenWidth * 1.9,
            borderRadius: screenWidth * 0.95,
            backgroundColor: colors.dome,
          },
          domeStyle,
        ]}
      />
      <View style={{ width, height }}>
        {items.map((item, index) => (
          <WheelItem
            key={item.key}
            item={item}
            index={index}
            active={active}
            reveal={reveal}
            spacing={spacing}
            size={size}
            radius={radius}
            width={width}
            onPress={() => {
              active.value = withSpring(index, SPRING);
              onChange(item.key);
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default WheelTabs;
