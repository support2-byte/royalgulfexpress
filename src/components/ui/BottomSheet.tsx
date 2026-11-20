import { useAppTheme } from "@/hooks/useAppTheme";
import { tr } from "@/i18n";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

// Critically damped, no overshoot. Same family of curves iOS uses for sheets.
const OPEN_MS = 340;
const CLOSE_MS = 240;
const EASE_OPEN = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SETTLE = Easing.bezier(0.25, 1, 0.5, 1);

const MAX_SHEET_WIDTH = 560;
const DISMISS_DISTANCE = 0.25;
const DISMISS_VELOCITY = 900;

interface Props {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet: React.FC<Props> = ({ visible, title, onClose, children }) => {
  const { colors, fontSize, fonts, isRTL } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  // The Modal stays mounted until the closing animation has finished.
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const sheetH = useSharedValue(screenH);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) {
      drag.value = 0;
      return;
    }
    if (visible) {
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OPEN });
    } else {
      Keyboard.dismiss();
      progress.value = withTiming(
        0,
        { duration: CLOSE_MS, easing: EASE_CLOSE },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
    }
  }, [visible, mounted]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const shouldClose =
        e.translationY > sheetH.value * DISMISS_DISTANCE ||
        e.velocityY > DISMISS_VELOCITY;
      if (shouldClose) {
        drag.value = withTiming(
          sheetH.value,
          { duration: 200, easing: EASE_CLOSE },
          (finished) => {
            if (finished) scheduleOnRN(onClose);
          },
        );
      } else {
        drag.value = withTiming(0, { duration: 240, easing: EASE_SETTLE });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      progress.value *
      interpolate(drag.value, [0, sheetH.value], [1, 0.25], "clamp"),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          interpolate(progress.value, [0, 1], [sheetH.value, 0], "clamp") +
          drag.value,
      },
    ],
  }));

  if (!mounted) return null;

  const maxHeight = Math.min(screenH * 0.8, screenH - insets.top - 24);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView
        style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={tr("Close")}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          onLayout={(e) => {
            sheetH.value = e.nativeEvent.layout.height;
          }}
          style={[
            styles.sheet,
            {
              maxHeight,
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View collapsable={false}>
              <View style={styles.handleArea}>
                <View style={[styles.handle, { backgroundColor: colors.dome }]} />
              </View>
              {!!title && (
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: fontSize.lg,
                    color: colors.ink,
                    marginBottom: 6,
                  }}
                >
                  {title}
                </Text>
              )}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(14,27,26,0.45)",
  },
  sheet: {
    width: "100%",
    maxWidth: MAX_SHEET_WIDTH,
    alignSelf: "center",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 4,
    overflow: "hidden",
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default BottomSheet;
