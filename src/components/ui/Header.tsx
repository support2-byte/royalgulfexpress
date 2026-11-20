import { flipIcon, ls, tr } from "@/i18n";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  name: string;
  description: string;
  icon: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const useSheetStyle = () => {
  const { colors } = useAppTheme();
  return {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden" as const,
  };
};

const Header: React.FC<HeaderProps> = ({
  name,
  description,
  icon,
  onBack,
  right,
}) => {
  const { setOpenProfile } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, fontSize, fonts, insets.top);

  const isDashboard = name === "Dashboard";

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
      <View style={styles.topRow}>
        {!isDashboard ? (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            hitSlop={10}
            activeOpacity={0.8}
            style={styles.roundBtn}
          >
            <Ionicons name={flipIcon("chevron-back") as any} size={22} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {right ?? (
          <TouchableOpacity
            onPress={() => isDashboard && setOpenProfile(true)}
            activeOpacity={0.8}
            disabled={!isDashboard}
            style={styles.iconBadge}
          >
            <Ionicons name={icon as any} color="#fff" size={19} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View entering={FadeInDown.duration(380).delay(60)}>
        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        {!!description && (
          <Text style={styles.text} numberOfLines={2}>
            {description}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
  topInset: number,
) =>
  StyleSheet.create({
    header: {
      paddingTop: topInset + 10,
      paddingHorizontal: 20,
      paddingBottom: 22,
      backgroundColor: colors.surface,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    roundBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primaryDeep,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontFamily: fonts.bold,
      color: colors.ink,
      letterSpacing: ls(-0.8),
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 19,
    },
  });

export default Header;
