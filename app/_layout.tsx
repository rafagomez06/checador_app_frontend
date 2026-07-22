import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";

// Mantener splash screen visible mientras se carga la app
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn(error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
