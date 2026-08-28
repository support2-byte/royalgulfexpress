import { useAppTheme } from "@/hooks/useAppTheme";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface QuickActionProps {
  icon: ImageSourcePropType;
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
        <Image source={icon} style={styles.icon} resizeMode="contain" />
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
      backgroundColor: colors.lightGrey,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      width: 28,
      height: 28,
    },
    text: {
      textAlign: "center",
      fontFamily: fonts.medium,
      fontSize: fontSize.xs ?? 11,
      color: colors.textSecondary,
      marginTop: 6,
    },
  });
