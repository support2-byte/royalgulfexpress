import Header from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import moment from "moment";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Alert() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } =
    useAppContext();
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

  const renderItem = ({ item }: { item: (typeof notifications)[number] }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleMarkAsRead(item.id)}
        style={[
          styles.card,
          !item.is_read && { backgroundColor: `${colors.primary}0D` },
        ]}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          {item.body && (
            <Text style={styles.cardText} numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text style={styles.cardTime}>
            {moment(item.created_at).fromNow()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Notifications"
        description="Stay up-to-date related to your shipping and invoices"
        icon="notifications"
      />

      {notifications.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 30,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderColor: colors.borderColor,
    },

    cardBody: {
      flex: 1,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.secondary,
      flexShrink: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    cardText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardTime: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      opacity: 0.7,
      marginTop: 4,
    },
  });
