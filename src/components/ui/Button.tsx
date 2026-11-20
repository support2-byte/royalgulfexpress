import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Text } from "@/components/ui/Text";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "accent" | "outline" | "ghost";
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
        ? colors.secondary
        : "transparent";
  const fg =
    variant === "outline" || variant === "ghost" ? colors.primary : "#fff";

  const styles = StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 54,
      borderRadius: 27,
      paddingHorizontal: 24,
      backgroundColor: bg,
      borderWidth: variant === "outline" ? 1.5 : 0,
      borderColor: colors.primary,
      opacity: disabled ? 0.45 : 1,
    },
    text: {
      fontSize: fontSize.md,
      fontFamily: fonts.semiBold,
      color: fg,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={18} color={fg} />}
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
