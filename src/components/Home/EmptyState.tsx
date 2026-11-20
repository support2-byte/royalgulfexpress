import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeIn } from "react-native-reanimated";

interface Props {
  label: string;
  icon?: string;
}

export const EmptyState: React.FC<Props> = ({
  label,
  icon = "file-tray-outline",
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 36,
      gap: 12,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} size={22} color={colors.lightText} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
};
