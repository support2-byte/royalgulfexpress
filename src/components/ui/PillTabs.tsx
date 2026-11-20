import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export interface PillTab<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  tabs: PillTab<K>[];
  active: K;
  onChange: (key: K) => void;
}

const SPRING = { damping: 20, stiffness: 240 };

export function PillTabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  const { colors, fontSize, fonts } = useAppTheme();
  const [layouts, setLayouts] = useState<Record<string, { x: number; w: number }>>({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const ready = useSharedValue(0);

  useEffect(() => {
    const l = layouts[active];
    if (!l) return;
    if (!ready.value) {
      x.value = l.x;
      w.value = l.w;
      ready.value = 1;
      return;
    }
    x.value = withSpring(l.x, SPRING);
    w.value = withSpring(l.w, SPRING);
  }, [active, layouts]);

  const thumb = useAnimatedStyle(() => ({
    opacity: ready.value,
    width: w.value,
    transform: [{ translateX: x.value }],
  }));

  const styles = StyleSheet.create({
    scroll: { marginHorizontal: -20 },
    row: { paddingHorizontal: 20, gap: 6 },
    wrap: { flexDirection: "row", gap: 6 },
    thumb: {
      position: "absolute",
      top: 0,
      left: 0,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.ink,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      height: 38,
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    textOn: { color: "#fff" },
    count: {
      fontSize: fontSize.xs,
      fontFamily: fonts.semiBold,
      color: colors.lightText,
    },
    countOn: { color: "rgba(255,255,255,0.65)" },
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <View style={styles.wrap}>
        <Animated.View style={[styles.thumb, thumb]} />
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.8}
              style={styles.item}
              onLayout={(e) => {
                const { x: lx, width } = e.nativeEvent.layout;
                setLayouts((prev) =>
                  prev[t.key]?.x === lx && prev[t.key]?.w === width
                    ? prev
                    : { ...prev, [t.key]: { x: lx, w: width } },
                );
              }}
              onPress={() => onChange(t.key)}
            >
              <Text style={[styles.text, on && styles.textOn]}>{t.label}</Text>
              {t.count !== undefined && (
                <Text style={[styles.count, on && styles.countOn]}>{t.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
