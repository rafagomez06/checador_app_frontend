// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import { useTheme } from "../context/ThemeContext";

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen name="login" options={{}} />
    </Stack>
  );
}
