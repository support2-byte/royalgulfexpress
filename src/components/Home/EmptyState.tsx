import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Props {
  label: string;
}

export const EmptyState: React.FC<Props> = ({ label }) => {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={emptyStyles.wrap}>
      <Ionicons name="file-tray-outline" size={20} color="#9AA0A6" />
      <Text style={emptyStyles.text}>{label}</Text>
    </Animated.View>
  );
};

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 6,
  },
  text: {
    fontSize: 13,
    color: "#9AA0A6",
  },
});
