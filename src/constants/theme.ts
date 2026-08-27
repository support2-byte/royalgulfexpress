import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#097D76",
    lightPrimary: "#0c9e94",
    secondary: "#F38120",
    text: "#2A2A2A",
    background: "#FFFFFF",
    textSecondary: "#60646C",
    lightText: "#929292",
    borderColor: "#e0e0e0",
  },

  dark: {
    primary: "#097D76",
    lightPrimary: "#0c9e94",
    secondary: "#F38120",
    text: "#DDDDDD",
    background: "#2A2A2A",
    textSecondary: "#B0B4BA",
    lightText: "#dbdbdb",
    borderColor: "#e0e0e0",
  },

  success: "#2AA63E",
  error: "#FB2C36",
  warning: "#FFB93B",
  info: "#3BB8DB",
} as const;

export type ThemeMode = "light" | "dark";

export const Fonts = {
  regular: "RedditSans-Regular",
  medium: "RedditSans-Medium",
  semiBold: "RedditSans-SemiBold",
  bold: "RedditSans-Bold",
} as const;

export const FontSize = {
  xs: Platform.select({ ios: 12, android: 11, default: 12 })!,
  sm: Platform.select({ ios: 14, android: 13, default: 14 })!,
  md: Platform.select({ ios: 16, android: 15, default: 16 })!,
  lg: Platform.select({ ios: 20, android: 18, default: 20 })!,
  xl: Platform.select({ ios: 24, android: 22, default: 24 })!,
  xxl: Platform.select({ ios: 30, android: 28, default: 28 })!,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;

export const ShipmentStatus = {
  Created: { bg: "#EDEDED", text: "#5A5F66", dot: "#5A5F66" },
  "Ready for Loading": { bg: "#FFF3E0", text: "#B4690E", dot: "#B4690E" },
  "Loaded into Container": { bg: "#E3F2FD", text: "#1565C0", dot: "#1565C0" },
  "Shipment Processing": { bg: "#F3E5F5", text: "#7B1FA2", dot: "#7B1FA2" },
  "Shipment In Transit": { bg: "#E1F5FE", text: "#0277BD", dot: "#0277BD" },
  "Under Processing": { bg: "#FFF8E1", text: "#B08600", dot: "#B08600" },
  "Arrived at Sort Facility": {
    bg: "#EDE7F6",
    text: "#5E35B1",
    dot: "#5E35B1",
  },
  "Ready for Delivery": { bg: "#E0F2F1", text: "#00695C", dot: "#00695C" },
  "Shipment Delivered": { bg: "#E8F5E9", text: "#16803C", dot: "#16803C" },
  Rejected: { bg: "#FFEBEE", text: "#C62828", dot: "#C62828" },
  Cancelled: { bg: "#F5F5F5", text: "#757575", dot: "#757575" },
} as const;

export type ShipmentStatusKey = keyof typeof ShipmentStatus;

export const DefaultStatusStyle = {
  bg: "#EDEDED",
  text: "#5A5F66",
  dot: "#5A5F66",
} as const;
