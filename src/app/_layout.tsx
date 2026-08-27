import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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
    <AuthProvider>
      <AppProvider>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade_from_bottom",
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
          </Stack>

          <Toast position="bottom" swipeable />
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
