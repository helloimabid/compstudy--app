import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

import { AppwriteProvider } from "@/components/AppwriteProvider";
import OfflineBanner from "@/components/OfflineBanner";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useInitialNotificationPermission } from "@/hooks/useInitialNotificationPermission";
import { useOTAUpdates } from "@/hooks/useOTAUpdates";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useOTAUpdates();
  useAppUpdate();
  useInitialNotificationPermission();

  return (
    <AppwriteProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 200,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile/[userId]"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="room" options={{ headerShown: false }} />
            <Stack.Screen name="blog/index" options={{ headerShown: false }} />
            <Stack.Screen name="blog/[slug]" options={{ headerShown: false }} />
            <Stack.Screen
              name="app-blocking"
              options={{ headerShown: false }}
            />
          </Stack>
          <OfflineBanner />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppwriteProvider>
  );
}
