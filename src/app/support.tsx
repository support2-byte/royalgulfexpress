import { tr } from "@/i18n";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";

import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Support() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const [headerH, setHeaderH] = useState(0);

  const { chatMessages, chatStatus, sendChatMessage } = useAppContext();
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    sendChatMessage(trimmed);
    setInputText("");
    setSending(false);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, sending, sendChatMessage]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages.length]);

  const renderItem = ({ item }: { item: (typeof chatMessages)[number] }) => {
    if (item.sender_type === "system") {
      return (
        <View style={styles.systemRow}>
          <View style={styles.systemDivider} />
          <Text style={styles.systemText}>{item.message}</Text>
          <View style={styles.systemDivider} />
        </View>
      );
    }

    const isUser = item.sender_type === user.type;
    return (
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={[
          styles.messageRow,
          isUser
            ? { justifyContent: "flex-end" }
            : { justifyContent: "flex-start" },
        ]}
      >
        <View style={{ maxWidth: "80%" }}>
          <View
            style={[
              styles.bubble,
              isUser ? styles.userBubble : styles.supportBubble,
            ]}
          >
            <Text style={isUser ? styles.userText : styles.supportText}>
              {item.message}
            </Text>
          </View>
          <Text
            style={[
              styles.timeText,
              isUser ? { textAlign: "right" } : { textAlign: "left" },
            ]}
          >
            {moment(item.created_at).format("h:mm A")}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <Header
          name="Support"
          description={tr("Chat with our team in real time")}
          icon="chatbubbles"
        />
      </View>

      <KeyboardAvoidingView
        style={sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerH : 0}
      >
        {chatStatus === "closed" && (
          <View style={styles.closedBanner}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.closedText}>
              {tr("This chat was closed. Sending a message starts a new conversation.")}
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={chatMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={tr("Write a message")}
            placeholderTextColor={colors.lightText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnIdle]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    closedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 20,
      marginTop: 18,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    closedText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
      gap: 14,
    },
    messageRow: {
      flexDirection: "row",
      width: "100%",
    },
    bubble: {
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 6,
    },
    supportBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 6,
    },
    userText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: "#fff",
      lineHeight: fontSize.sm * 1.45,
    },
    supportText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.ink,
      lineHeight: fontSize.sm * 1.45,
    },
    timeText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      marginTop: 4,
      marginHorizontal: 6,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 14,
      paddingLeft: 18,
      paddingRight: 6,
      paddingVertical: 6,
      borderRadius: 28,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.ink,
      maxHeight: 100,
      paddingTop: 11,
      paddingBottom: 11,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnIdle: {
      backgroundColor: colors.dome,
    },
    systemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginVertical: 6,
    },
    systemDivider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderColor,
    },
    systemText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
    },
  });
