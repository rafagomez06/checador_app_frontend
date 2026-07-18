// app/(tabs)/checador/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

type CheckType =
  | "inicio_jornada"
  | "fin_jornada"
  | "inicio_comida"
  | "fin_comida";

export default function ChecadorScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<{
    type: CheckType;
    time: string;
  } | null>(null);
  const { theme, isDarkMode } = useTheme();

  const styles = getStyles(theme);

  const checkOptions = [
    {
      id: "inicio_jornada" as CheckType,
      label: "Inicio Jornada",
      icon: "log-in-outline",
      color: "#4CAF50",
      bgColor: "rgba(76, 175, 80, 0.1)",
    },
    {
      id: "inicio_comida" as CheckType,
      label: "Inicio Comida",
      icon: "restaurant-outline",
      color: "#FF9800",
      bgColor: "rgba(255, 152, 0, 0.1)",
    },
    {
      id: "fin_comida" as CheckType,
      label: "Fin Comida",
      icon: "restaurant",
      color: "#2196F3",
      bgColor: "rgba(33, 150, 243, 0.1)",
    },
    {
      id: "fin_jornada" as CheckType,
      label: "Fin Jornada",
      icon: "log-out-outline",
      color: "#F44336",
      bgColor: "rgba(244, 67, 54, 0.1)",
    },
  ];

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Error",
          "Se necesitan permisos de ubicación para realizar checadas",
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la ubicación");
      return null;
    }
  };

  const handleCheck = async (type: CheckType) => {
    setIsLoading(true);

    try {
      const location = await getLocation();
      if (!location) {
        setIsLoading(false);
        return;
      }

      const checkLabel =
        checkOptions.find((opt) => opt.id === type)?.label || "";
      Alert.alert(
        "Confirmar Checada",
        `¿Estás seguro de registrar "${checkLabel}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                // Aquí va tu llamada a la API
                // const response = await fetch('http://tu-api/checador/registrar', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({
                //     usuario_id: 31,
                //     ubicacion: {
                //       latitud: location.latitude,
                //       longitud: location.longitude,
                //     },
                //     check_type: type,
                //   }),
                // });

                await new Promise((resolve) => setTimeout(resolve, 1000));

                const now = new Date();
                setLastCheck({
                  type,
                  time: now.toLocaleTimeString(),
                });

                Alert.alert("Éxito", `${checkLabel} registrada correctamente`);
              } catch (error) {
                Alert.alert("Error", "Error al registrar checada");
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Error al obtener ubicación");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      /> */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Checador
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Registro de asistencia
          </Text>
        </View>

        {/* Última checada */}
        {lastCheck && (
          <View
            style={[
              styles.lastCheckContainer,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
              },
            ]}
          >
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.lastCheckText, { color: theme.text }]}>
              Última checada:{" "}
              {checkOptions.find((opt) => opt.id === lastCheck.type)?.label} -{" "}
              {lastCheck.time}
            </Text>
          </View>
        )}

        {/* Contenedor horario */}
        <View
          style={[styles.profileContainer, { backgroundColor: theme.surface }]}
        >
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={80}
              color={theme.primary}
            />
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            ¡Bienvenido!
          </Text>
          <Text
            style={[styles.greetingSubtext, { color: theme.textSecondary }]}
          >
            Selecciona una opción para registrar tu checada
          </Text>
        </View>

        {/* Botones de checada */}
        <View style={styles.gridContainer}>
          {checkOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.checkCard,
                {
                  backgroundColor: option.bgColor,
                  borderColor: option.color,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => handleCheck(option.id)}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: option.color + "20" },
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={32}
                  color={option.color}
                />
              </View>
              <Text style={[styles.checkLabel, { color: option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <Ionicons name="time-outline" size={40} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Procesando checada...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    lastCheckContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 20,
    },
    lastCheckText: {
      marginLeft: 10,
      fontSize: 14,
      flex: 1,
    },
    greetingContainer: {
      marginTop: 29,
      marginBottom: 29,
      flexDirection: "column",
      alignItems: "center",
    },
    greetingText: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
    },
    greetingSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    checkCard: {
      width: "48%",
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.03)",
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    checkLabel: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      padding: 30,
      borderRadius: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(74, 144, 226, 0.3)",
    },
    loadingText: {
      color: colors.text,
      marginTop: 12,
      fontSize: 16,
    },
    profileContainer: {
      alignItems: "center",
      paddingVertical: 30,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  });
