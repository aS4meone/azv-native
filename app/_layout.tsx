import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "react-native-url-polyfill/auto";

import { EdgeToEdgeHandler } from "@/components/EdgeToEdgeHandler";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Configure app for production use
    if (Platform.OS === "android") {
      // Android-specific configurations
      console.log("🤖 Running on Android");
    } else if (Platform.OS === "ios") {
      // iOS-specific configurations
      console.log("🍎 Running on iOS");
    }
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <EdgeToEdgeHandler>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                title: "AZV Motors",
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </EdgeToEdgeHandler>
    </SafeAreaProvider>
  );
}
