import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [esBiometricoDisponible, setEsBiometricoDisponible] = useState(false);
  const [tipoBiometrico, setTipoBiometrico] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  // Efecto de entrada con animación
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    checkBiometricAvailability();
  }, []);

  // Verificar disponibilidad de autenticación biométrica
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (compatible && enrolled) {
        setEsBiometricoDisponible(true);

        // Detectar tipo de biometría
        if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT,
          )
        ) {
          setTipoBiometrico("Huella");
        } else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setTipoBiometrico("Face ID");
        } else if (
          supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
        ) {
          setTipoBiometrico("Escáner de iris");
        }
      }
    } catch (error) {
      console.log("Error checking biometric:", error);
    }
  };

  // Login con usuario y contraseña
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(
        "Error",
        "Por favor ingrese el usuario y contraseña, intente de nuevo.",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Simular llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulación de éxito
      if (username === "test" && password === "123") {
        router.replace("/(tabs)/perfil/perfil");
      } else {
        Alert.alert("Error", "Credenciales incorrectas, intente de nuevo.");
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  // Login con biometría
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Autenticación Biométrica",
        fallbackLabel: "Usar contraseña",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.replace("/(tabs)/perfil/perfil");
        setIsLoading(false);
      } else {
        if (result.error === "user_cancel") {
          console.log("Usuario canceló la autenticación");
        } else {
          Alert.alert("Error", "Autenticación biométrica fallida");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Error al autenticar con biometría");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      /> */}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo o Icono */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { borderColor: theme.primary }]}>
            <Ionicons name="time-outline" size={60} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            Checador App
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Control de asistencia
          </Text>
        </View>

        {/* Formulario de Login */}
        <View
          style={[
            styles.formContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Bienvenido
          </Text>
          <Text style={[styles.welcomeSubtext, { color: theme.textSecondary }]}>
            Inicia sesión para continuar
          </Text>

          {/* Campo Usuario */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Usuario"
              placeholderTextColor={theme.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Campo Contraseña */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1, color: theme.text }]}
              placeholder="Contraseña"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Botón Login */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Botón Biometría */}
          {esBiometricoDisponible && (
            <TouchableOpacity
              style={[
                styles.biometricButton,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.primaryLight,
                },
              ]}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Ionicons
                name={
                  tipoBiometrico === "Huella"
                    ? "finger-print-outline"
                    : "scan-outline"
                }
                size={24}
                color={theme.primary}
              />
              <Text
                style={[styles.biometricButtonText, { color: theme.primary }]}
              >
                {`Acceder con ${tipoBiometrico}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Enlace Olvidé contraseña */}
          {/* <TouchableOpacity style={styles.forgotPassword}>
            <Text
              style={[styles.forgotPasswordText, { color: theme.textTertiary }]}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity> */}
        </View>

        {/* Versión */}
        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          Versión 1.0.0
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 30,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    appName: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      letterSpacing: 1,
    },
    appSubtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      marginTop: 4,
      letterSpacing: 2,
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    welcomeSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 50,
      color: colors.text,
      fontSize: 16,
    },
    eyeIcon: {
      padding: 8,
    },
    loginButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    biometricButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    biometricButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "500",
      marginLeft: 10,
    },
    forgotPassword: {
      marginTop: 16,
      alignItems: "center",
    },
    forgotPasswordText: {
      color: colors.textTertiary,
      fontSize: 14,
    },
    versionText: {
      textAlign: "center",
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 24,
    },
  });
