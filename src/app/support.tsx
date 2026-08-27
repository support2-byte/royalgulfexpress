import Header from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Support() {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

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
      <View
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header name="Support" description="Live Chat" icon="chatbubbles" />

      {chatStatus === "closed" && (
        <View
          style={{ paddingVertical: 6, backgroundColor: colors.background }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: fontSize.xs,
              color: colors.textSecondary,
            }}
          >
            This chat was closed. Sending a message will start a new
            conversation.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
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
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    listContent: {
      padding: 16,
      gap: 14,
    },
    messageRow: {
      flexDirection: "row",
      width: "100%",
    },
    bubble: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    supportBubble: {
      backgroundColor: colors.background,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    userText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: "#fff",
      lineHeight: fontSize.sm * 1.4,
    },
    supportText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: fontSize.sm * 1.4,
    },
    timeText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 4,
      marginHorizontal: 4,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderColor: colors.borderColor,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.secondary,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    systemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginVertical: 4,
    },
    systemDivider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderColor,
    },
    systemText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
  });
