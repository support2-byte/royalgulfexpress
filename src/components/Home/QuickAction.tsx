import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface QuickActionProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onPress,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} color={colors.textSecondary} size={22} />
      </View>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    item: {
      width: "23%",
      alignItems: "center",
      marginBottom: 16,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: colors.borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      textAlign: "center",
      fontFamily: fonts.medium,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginTop: 6,
    },
  });
