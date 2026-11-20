import "@/i18n/patches";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider, useI18n } from "@/i18n";
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
} from "@expo-google-fonts/noto-sans-arabic";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

import RedditSansBold from "../../assets/fonts/RedditSans-Bold.ttf";
import RedditSansMedium from "../../assets/fonts/RedditSans-Medium.ttf";
import RedditSansRegular from "../../assets/fonts/RedditSans-Regular.ttf";
import RedditSansSemiBold from "../../assets/fonts/RedditSans-SemiBold.ttf";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "RedditSans-Regular": RedditSansRegular,
    "RedditSans-Medium": RedditSansMedium,
    "RedditSans-SemiBold": RedditSansSemiBold,
    "RedditSans-Bold": RedditSansBold,
    "NotoSansArabic-Regular": NotoSansArabic_400Regular,
    "NotoSansArabic-Medium": NotoSansArabic_500Medium,
    "NotoSansArabic-SemiBold": NotoSansArabic_600SemiBold,
    "NotoSansArabic-Bold": NotoSansArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <Direction>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade_from_bottom",
              contentStyle: { backgroundColor: "#F4F6F6" },
            }}
            initialRouteName="index"
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="shipments" />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="delivery-options" />
            <Stack.Screen name="shipment-details" />
            <Stack.Screen name="purchase-storage" />
            <Stack.Screen name="gatepass-history" />
            <Stack.Screen name="invoices" />
            <Stack.Screen name="pay-invoice" />
            <Stack.Screen name="alerts" />
            <Stack.Screen name="support" />
            <Stack.Screen name="pay-webview" />
          </Stack>

          <Toast position="bottom" swipeable />
        </ThemeProvider>
          </Direction>
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

/** Flips layout direction for Arabic / Urdu without needing an app restart. */
function Direction({ children }: { children: React.ReactNode }) {
  const { isRTL } = useI18n();
  return (
    <View style={{ flex: 1, direction: isRTL ? "rtl" : "ltr" }}>{children}</View>
  );
}
