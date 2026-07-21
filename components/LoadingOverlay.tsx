// components/LoadingOverlay.tsx
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../app/context/ThemeContext";
import LoadingSpinner from "./LoadingSpinner";

const { width, height } = Dimensions.get("window");

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  iconName?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = "Procesando checada...",
  iconName = "hourglass-outline",
}) => {
  const { theme, isDarkMode } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: isDarkMode ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <LoadingSpinner text={text} iconName={iconName} showText={true} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  container: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default LoadingOverlay;
