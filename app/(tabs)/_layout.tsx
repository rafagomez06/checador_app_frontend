import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, useColorScheme } from "react-native";

// Constantes de colores
const COLORS = {
  light: {
    background: "#FFFFFF",
    surface: "#F5F7FA",
    surfaceElevated: "#FFFFFF",
    primary: "#4A90E2",
    primaryLight: "#EBF3FE",
    text: "#1A1A2E",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    border: "#E5E7EB",
    shadow: "rgba(0, 0, 0, 0.05)",
    icon: "#4A90E2",
    iconSecondary: "#6B7280",
    danger: "#EF4444",
    dangerLight: "#FEE2E2",
    success: "#10B981",
    card: "#FFFFFF",
    tabBarActive: "#4A90E2",
    tabBarInactive: "#9CA3AF",
    tabBarBackground: "#FFFFFF",
    tabBarBorder: "#E5E7EB",
  },
  dark: {
    background: "#1A1A2E",
    surface: "#24243E",
    surfaceElevated: "#2D2D4A",
    primary: "#60A5FA",
    primaryLight: "rgba(96, 165, 250, 0.1)",
    text: "#F3F4F6",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    border: "rgba(255, 255, 255, 0.08)",
    shadow: "rgba(0, 0, 0, 0.3)",
    icon: "#60A5FA",
    iconSecondary: "#9CA3AF",
    danger: "#EF4444",
    dangerLight: "rgba(239, 68, 68, 0.1)",
    success: "#34D399",
    card: "#2D2D4A",
    tabBarActive: "#60A5FA",
    tabBarInactive: "#6B7280",
    tabBarBackground: "#1A1A2E",
    tabBarBorder: "rgba(255, 255, 255, 0.08)",
  },
};

export default function TabsLayout() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(COLORS.light);

  // Cargar preferencia de tema al iniciar
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Escuchar cambios en el tema del sistema
  useEffect(() => {
    // Si no hay preferencia guardada, usar el tema del sistema
    if (systemColorScheme === "dark") {
      setIsDarkMode(true);
      setTheme(COLORS.dark);
    }
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem("@theme_preference");
      if (saved !== null) {
        const isDark = saved === "dark";
        setIsDarkMode(isDark);
        setTheme(isDark ? COLORS.dark : COLORS.light);
      } else {
        // Si no hay preferencia, usar el tema del sistema
        if (systemColorScheme === "dark") {
          setIsDarkMode(true);
          setTheme(COLORS.dark);
        }
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  };

  // Obtener colores del tema actual
  const currentTheme = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: currentTheme.tabBarBackground,
          borderTopColor: currentTheme.tabBarBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          borderTopWidth: 1,
          shadowColor: currentTheme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 4,
        },
        tabBarActiveTintColor: currentTheme.tabBarActive,
        tabBarInactiveTintColor: currentTheme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Checador",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Estilos (aunque no se usan directamente en este archivo)
const getStyles = (colors: typeof COLORS.light) =>
  StyleSheet.create({
    // Los estilos se definen en cada pantalla individual
  });
