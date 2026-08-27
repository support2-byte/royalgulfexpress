import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  name: string;
  description: string;
  icon: string;
}

const Header: React.FC<HeaderProps> = ({ name, description, icon }) => {
  const { setOpenProfile } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, fontSize, fonts, insets.top);

  const isDashboard = name === "Dashboard";

  const handleOpenMenu = () => {
    if (isDashboard) setOpenProfile(true);
  };

  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={[colors.primary, colors.lightPrimary]}
      style={styles.header}
    >
      <View style={styles.row}>
        {!isDashboard && (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.background} />
          </TouchableOpacity>
        )}

        <View style={styles.textBlock}>
          <Text style={styles.title}>{name}</Text>
          {!!description && (
            <Text style={styles.text} numberOfLines={1}>
              {description}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleOpenMenu}
        activeOpacity={0.8}
        disabled={!isDashboard}
      >
        <BlurView intensity={35} tint="light" style={styles.iconCard}>
          <Ionicons name={icon as any} color={colors.background} size={20} />
        </BlurView>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
  topInset: number,
) =>
  StyleSheet.create({
    header: {
      paddingTop: topInset,
      paddingHorizontal: 20,
      paddingBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
      marginRight: 12,
    },
    textBlock: { flexShrink: 1 },
    title: {
      fontSize: fontSize.xl,
      fontFamily: fonts.bold,
      color: colors.background,
      letterSpacing: -0.3,
    },
    text: {
      maxWidth: 240,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: "rgba(255,255,255,0.85)",
      marginTop: 2,
    },
    iconCard: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
  });

export default Header;
