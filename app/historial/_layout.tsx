// app/historial/_layout.tsx
import { Stack } from "expo-router";
import { useTheme } from "../context/ThemeContext";

export default function HistorialLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Historial de Checadas",
        }}
      />
    </Stack>
  );
}
