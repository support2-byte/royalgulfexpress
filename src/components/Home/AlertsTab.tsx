import { tr } from "@/i18n";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import moment from "moment";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { EmptyState } from "./EmptyState";
import { SectionHeader } from "./SectionHeader";

export const AlertsTab: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const latest = notifications.slice(0, 8);

  if (latest.length === 0) {
    return (
      <EmptyState icon="notifications-outline" label="You're all caught up." />
    );
  }

  return (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.count}>
          {unreadNotificationCount > 0
            ? tr("{n} unread", { n: unreadNotificationCount })
            : "All read"}
        </Text>
        {unreadNotificationCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsAsRead} hitSlop={10}>
            <Text style={styles.action}>{tr("Mark all read")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {latest.map((n, index) => (
        <Animated.View
          key={n.id}
          entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 45)}
        >
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.row}
            onPress={() => {
              if (!n.is_read) markNotificationAsRead(n.id);
            }}
          >
            <View style={styles.dotWrap}>
              {!n.is_read && <View style={styles.dot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.title, n.is_read && styles.titleRead]}
                numberOfLines={1}
              >
                {n.title}
              </Text>
              {n.body ? (
                <Text style={styles.body} numberOfLines={2}>
                  {n.body}
                </Text>
              ) : null}
            </View>
            <Text style={styles.time}>{moment(n.created_at).fromNow(true)}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      <SectionHeader
        title=""
        actionLabel={tr("Open all alerts")}
        onAction={() => router.navigate("/alerts")}
      />
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 6,
    },
    count: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    action: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.secondary,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    dotWrap: {
      width: 10,
      paddingTop: 6,
      alignItems: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondary,
    },
    title: {
      fontSize: fontSize.sm,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    titleRead: {
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    body: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 3,
      lineHeight: 17,
    },
    time: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.lightText,
      paddingTop: 2,
    },
  });
