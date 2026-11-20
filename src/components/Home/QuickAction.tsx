import { flipIcon, tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";

interface QuickActionProps {
  icon: ImageSourcePropType;
  label: string;
  description?: string;
  index?: number;
  onPress?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  description,
  index = 0,
  onPress,
}) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 45)}
    >
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.6}
        onPress={onPress}
      >
        <View style={styles.iconWrap}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {description && (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          )}
        </View>
        <Ionicons name={flipIcon("chevron-forward") as any} size={16} color={colors.lightText} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      gap: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: 24,
      height: 24,
    },
    textBlock: {
      flex: 1,
    },
    label: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    description: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
