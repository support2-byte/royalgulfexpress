import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeIn } from "react-native-reanimated";

interface Props {
  loading?: boolean;
  icon?: string;
  label?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateView: React.FC<Props> = ({
  loading,
  icon = "file-tray-outline",
  label,
  actionLabel,
  onAction,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingHorizontal: 40,
      paddingVertical: 40,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    action: {
      paddingHorizontal: 22,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    actionText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: "#fff",
    },
  });

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} size={26} color={colors.lightText} />
      </View>
      {!!label && <Text style={styles.text}>{label}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};
