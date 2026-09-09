import { confirmNgeniusPayment } from "@/lib/paymentService";
import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PayWebviewScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavChange}
      />
    </SafeAreaView>
  );
}
