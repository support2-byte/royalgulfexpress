import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const SIDEBAR_WIDTH = Math.min(Dimensions.get("window").width * 0.62, 260);

interface ProfileSidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileSidebar({
  visible,
  onClose,
}: ProfileSidebarProps) {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const scrimOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : -SIDEBAR_WIDTH, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    scrimOpacity.value = withTiming(visible ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  const initials = getInitials(user?.fullName);

  const handleLogoutPress = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: handleConfirmedLogout },
    ]);
  };

  const handleConfirmedLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (error) {
      console.warn("[ProfileSidebar] Unexpected logout error:", error);
      onClose();
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: "Edit Profile",
      icon: "person-outline",
      onPress: () => {
        onClose();
        // router.navigate("/edit-profile");
      },
    },
    {
      label: "Support",
      icon: "help-buoy-outline",
      onPress: () => {
        onClose();
        router.navigate("/support");
      },
    },
    {
      label: "Logout",
      icon: "log-out-outline",
      destructive: true,
      onPress: handleLogoutPress,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
        />
      </Pressable>

      <Animated.View style={[styles.sidebar, sidebarStyle]}>
        <SafeAreaView style={styles.sidebarInner} edges={["top", "bottom"]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.profileBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.fullName} numberOfLines={1}>
              {user?.fullName ?? "—"}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.6}
                disabled={loggingOut}
              >
                <View
                  style={[
                    styles.menuIconWrap,
                    item.destructive && styles.menuIconWrapDestructive,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={item.destructive ? "#DC2626" : colors.text}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.destructive && loggingOut ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : !item.destructive ? (
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textSecondary}
                  />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.versionText}>v1.0.0</Text>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function getInitials(fullName?: string) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    scrim: {
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    sidebar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: colors.background,
    },
    sidebarInner: {
      flex: 1,
      paddingHorizontal: 20,
    },
    closeBtn: {
      alignSelf: "flex-end",
      padding: 6,
      marginTop: 8,
    },
    profileBlock: {
      alignItems: "center",
      paddingVertical: 12,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg,
      color: "#fff",
    },
    fullName: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
      maxWidth: "100%",
    },
    email: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
      maxWidth: "100%",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "#E1E1E3",
      marginVertical: 10,
    },
    menuList: {
      marginTop: 4,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    menuIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: "#F2F2F3",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuIconWrapDestructive: {
      backgroundColor: "#FEE2E2",
    },
    menuLabel: {
      flex: 1,
      fontFamily: fonts.medium ?? fonts.regular,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    menuLabelDestructive: {
      color: "#DC2626",
    },
    versionText: {
      textAlign: "center",
      fontSize: fontSize.xs ?? 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: 16,
      opacity: 0.6,
    },
  });
