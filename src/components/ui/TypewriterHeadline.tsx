import { useAppTheme } from "@/hooks/useAppTheme";
import { ls, tr } from "@/i18n";
import React, { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

/**
 * Each headline is [strong part, muted part]. Keep the English sentences the
 * same length so the layout never jumps between them.
 */
export const HEADLINES: [string, string][] = [
  ["Your cargo,", "all in one place."],
  ["Ship smarter,", "deliver sooner."],
  ["Follow it live,", "door to door."],
];

const TYPE_MS = 46;
const WORD_MS = 190;
const ERASE_MS = 16;
const HOLD_MS = 2400;
const GAP_MS = 380;

type Phase = "typing" | "holding" | "erasing" | "gap";

/**
 * Typewriter loop for the home headline. Arabic-script languages reveal word
 * by word, because letter-by-letter typing breaks letter joining.
 */
const TypewriterHeadline: React.FC = () => {
  const { colors, fonts, isRTL } = useAppTheme();

  const sentences = useMemo(
    () => HEADLINES.map(([a, b]) => [tr(a), tr(b)] as [string, string]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRTL, fonts],
  );

  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [cursorOn, setCursorOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  const [strong, muted] = sentences[index % sentences.length];
  const full = `${strong} ${muted}`;
  const units = useMemo(
    () => (isRTL ? full.split(" ") : Array.from(full)),
    [full, isRTL],
  );
  const total = units.length;

  // restart cleanly when the language changes
  useEffect(() => {
    setIndex(0);
    setCount(0);
    setPhase("typing");
  }, [isRTL, fonts]);

  useEffect(() => {
    if (reduceMotion) {
      setCount(total);
      const id = setTimeout(() => setIndex((i) => (i + 1) % sentences.length), 4200);
      return () => clearTimeout(id);
    }

    let id: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (count < total) {
        id = setTimeout(() => setCount((c) => c + 1), isRTL ? WORD_MS : TYPE_MS);
      } else {
        id = setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      id = setTimeout(() => setPhase("erasing"), HOLD_MS);
    } else if (phase === "erasing") {
      if (count > 0) {
        id = setTimeout(
          () => setCount((c) => Math.max(0, c - (isRTL ? 1 : 1))),
          isRTL ? WORD_MS / 2 : ERASE_MS,
        );
      } else {
        id = setTimeout(() => setPhase("gap"), 0);
      }
    } else {
      id = setTimeout(() => {
        setIndex((i) => (i + 1) % sentences.length);
        setPhase("typing");
      }, GAP_MS);
    }
    return () => clearTimeout(id);
  }, [phase, count, total, isRTL, reduceMotion, sentences.length, index]);

  useEffect(() => {
    if (reduceMotion || isRTL) return;
    const id = setInterval(() => setCursorOn((v) => !v), 520);
    return () => clearInterval(id);
  }, [reduceMotion, isRTL]);

  const typed = isRTL ? units.slice(0, count).join(" ") : units.slice(0, count).join("");
  const strongShown = typed.slice(0, strong.length);
  const mutedShown = typed.length > strong.length ? typed.slice(strong.length) : "";

  const lineHeight = isRTL ? 44 : 36;
  const textStyle = {
    fontSize: 30,
    lineHeight,
    fontFamily: fonts.bold,
    letterSpacing: ls(-0.8),
  };

  // Reserve the height of the longest sentence so nothing moves while typing.
  const longest = sentences.reduce(
    (a, s) => (`${s[0]} ${s[1]}`.length > a.length ? `${s[0]} ${s[1]}` : a),
    "",
  );

  return (
    <View style={styles.wrap} accessible accessibilityLabel={full}>
      <Text style={[textStyle, styles.ghost]} numberOfLines={2}>
        {longest}
      </Text>
      <Text style={[textStyle, styles.layer, { color: colors.ink }]}>
        {strongShown}
        <Text style={{ color: colors.lightText }}>{mutedShown}</Text>
        {!isRTL && !reduceMotion && (
          <Text style={{ color: cursorOn ? colors.secondary : "transparent" }}>
            |
          </Text>
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  ghost: { opacity: 0 },
  layer: { position: "absolute", left: 0, right: 0, top: 0 },
});

export default TypewriterHeadline;
