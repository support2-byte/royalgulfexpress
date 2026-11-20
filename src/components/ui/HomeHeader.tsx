import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const initialsOf = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const HomeHeader: React.FC = () => {
  const { user } = useAuth();
  const { setOpenProfile, unreadNotificationCount } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, fontSize, fonts, insets.top);

  const firstName = user?.fullName?.trim().split(" ")[0];

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
      <TouchableOpacity
        style={styles.profile}
        activeOpacity={0.8}
        onPress={() => setOpenProfile(true)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user?.fullName)}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>{tr(greeting())}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {firstName || "Welcome back"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bell}
        activeOpacity={0.8}
        onPress={() => router.navigate("/alerts")}
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color={colors.ink}
        />
        {unreadNotificationCount > 0 && <View style={styles.bellDot} />}
      </TouchableOpacity>
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
      paddingBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    profile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexShrink: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
    textBlock: {
      flexShrink: 1,
    },
    greeting: {
      fontSize: fontSize.xs,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    name: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
      marginTop: 1,
    },
    bell: {
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
    bellDot: {
      position: "absolute",
      top: 11,
      right: 12,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: "#fff",
    },
  });

export default HomeHeader;
