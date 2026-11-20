import { tr } from "@/i18n";
import { useAppTheme } from "@/hooks/useAppTheme";
import { confirmNgeniusPayment } from "@/lib/paymentService";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PayWebviewScreen() {
  const { colors, fontSize, fonts } = useAppTheme();
  const { paymentUrl, orderReferenceId } = useLocalSearchParams<{
    paymentUrl: string;
    orderReferenceId: string;
  }>();

  const handleNavChange = async (navState: { url: string }) => {
    if (navState.url.includes("/payments/ngenius/redirect")) {
      try {
        const { state } = await confirmNgeniusPayment(orderReferenceId);
        if (state === "PURCHASED" || state === "CAPTURED") {
          Alert.alert("Payment Successful", "Your invoice has been paid.");
        } else {
          Alert.alert("Payment Incomplete", "The payment was not completed.");
        }
      } catch (err) {
        console.log("Confirm call threw:", err);
        Alert.alert(
          "Payment Failed",
          "Something went wrong. Please try again.",
        );
      } finally {
        setTimeout(() => router.back(), 3000);
      }
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    close: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: fontSize.md,
      color: colors.ink,
    },
    lock: { flexDirection: "row", alignItems: "center", gap: 6 },
    lockText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    web: {
      flex: 1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
      backgroundColor: "#fff",
    },
    loader: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.bar}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>{tr("Secure payment")}</Text>
        <View style={styles.lock}>
          <Ionicons name="lock-closed" size={13} color={colors.primary} />
          <Text style={styles.lockText}>{tr("N-Genius")}</Text>
        </View>
      </View>
      <View style={styles.web}>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
