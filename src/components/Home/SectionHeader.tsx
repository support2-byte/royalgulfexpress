import { useAppTheme } from "@/hooks/useAppTheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<Props> = ({
  title,
  actionLabel,
  onAction,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 26,
      marginBottom: 6,
    },
    title: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    action: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.secondary,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={10}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
