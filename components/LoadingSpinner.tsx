// components/LoadingSpinner.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../app/context/ThemeContext";

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
  iconName?: string;
  showText?: boolean;
}
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Procesando checada...",
  size = 50,
  iconName = "hourglass-outline",
  showText = true,
}) => {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name={iconName as any} size={size} color={theme.primary} />
      </Animated.View>
      {showText && (
        <Text style={[styles.text, { color: theme.text }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default LoadingSpinner;
