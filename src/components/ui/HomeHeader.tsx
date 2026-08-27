import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HomeHeader: React.FC = () => {
  const { user } = useAuth();
  const { setOpenProfile } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, fontSize, fonts, insets.top);

  const handleOpenMenu = () => {
    setOpenProfile(true);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(50)}
      style={styles.header}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.text} numberOfLines={1}>
          Welcome Back!
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleOpenMenu}
        activeOpacity={0.8}
        style={styles.avatarCircle}
      >
        <Ionicons name="person-circle" color={colors.textSecondary} size={26} />
      </TouchableOpacity>
    </Animated.View>
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
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      backgroundColor: colors.background,
    },
    textBlock: { flexShrink: 1 },
    title: {
      fontSize: fontSize.xxl ?? 26,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default HomeHeader;
