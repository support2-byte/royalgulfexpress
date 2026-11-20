import { tr } from "@/i18n";
import { EmptyState } from "@/components/Home/EmptyState";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import moment from "moment";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Alert() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();

  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleMarkAsRead = useCallback(
    (id: number) => {
      markNotificationAsRead(id);
    },
    [markNotificationAsRead],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof notifications)[number];
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}
    >
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => handleMarkAsRead(item.id)}
        style={styles.row}
      >
        <View style={styles.dotWrap}>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.body}>
          <Text
            style={[styles.title, item.is_read && styles.titleRead]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.body && (
            <Text style={styles.text} numberOfLines={2}>
              {item.body}
            </Text>
          )}
        </View>
        <Text style={styles.time}>{moment(item.created_at).fromNow(true)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Notifications"
        description={tr("Updates on your shipments and invoices")}
        icon="notifications"
      />

      <View style={sheet}>
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            label="You're all caught up."
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.topRow}>
                <Text style={styles.count}>
                  {unreadNotificationCount > 0
                    ? tr("{n} unread", { n: unreadNotificationCount })
                    : "All read"}
                </Text>
                {unreadNotificationCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllNotificationsAsRead}
                    hitSlop={10}
                  >
                    <Text style={styles.action}>{tr("Mark all read")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 40,
    },
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
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    dotWrap: {
      width: 10,
      paddingTop: 6,
      alignItems: "center",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondary,
    },
    body: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.md,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    titleRead: {
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    text: {
      fontSize: fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 3,
      lineHeight: 19,
    },
    time: {
      fontSize: fontSize.xs,
      fontFamily: fonts.regular,
      color: colors.lightText,
      paddingTop: 3,
    },
  });
