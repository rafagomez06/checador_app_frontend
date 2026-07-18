import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useColorScheme } from "react-native";

// Constantes de colores
export const COLORS = {
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

type ThemeType = typeof COLORS.light;
type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<ThemeType>(COLORS.light);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem("@theme_preference");
      if (saved !== null) {
        const isDark = saved === "dark";
        setIsDarkMode(isDark);
        setTheme(isDark ? COLORS.dark : COLORS.light);
      } else if (systemColorScheme === "dark") {
        setIsDarkMode(true);
        setTheme(COLORS.dark);
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(
        "@theme_preference",
        isDark ? "dark" : "light",
      );
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    setTheme(newIsDark ? COLORS.dark : COLORS.light);
    saveThemePreference(newIsDark);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
    setTheme(isDark ? COLORS.dark : COLORS.light);
    saveThemePreference(isDark);
  };

  if (isLoading) {
    return null; // o un componente de carga
  }

  return (
    <ThemeContext.Provider
      value={{ theme, isDarkMode, toggleTheme, setDarkMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
