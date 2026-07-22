// app/(tabs)/checador/index.tsx
import LoadingOverlay from "@/components/LoadingOverlay";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STATUS_CODES } from "../../constants/messages";

import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
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
import { getApiUrl } from "../../config/configApiURL";
import { useTheme } from "../context/ThemeContext";
//Tipos checadas
type CheckType =
  | "inicio_jornada"
  | "inicio_comida"
  | "fin_comida"
  | "fin_jornada";

// Estados del flujo
type flujoEstado =
  | "initial" // Sin checadas
  | "jornada_iniciada" // Después de inicio jornada
  | "comida_iniciada" // Después de inicio comida
  | "comida_terminada" // Después de fin comida
  | "jornada_terminada" // Después de fin jornada
  | "bloqueado"; // Flujo completado

export default function ChecadorScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Procesando checada...");
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<{
    type: CheckType;
    time: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, isDarkMode } = useTheme();
  const [ubicacionActual, setUbicacionActual] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [direccionActual, setDireccionActual] = useState<any>(null);
  const [isLoadingUbicacion, setIsLoadingUbicacion] = useState(true);
  const [flujoEstado, setFlujoEstado] = useState<flujoEstado>("initial");
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  //Obtener API
  const API_BASE_URL = getApiUrl();
  //Estilos Base
  const styles = getStyles(theme);

  // eliminado de estado PRUEBAS

  useEffect(() => {
    console.log("ELIMINANDO ESTADO PARA PRUEBAS");
    AsyncStorage.clear();
  }, []);

  //Obtener ubicacion dispositivo al renderizar pantalla
  useEffect(() => {
    const obtenerUbicacionInicial = async () => {
      try {
        console.log("RENDERIZADO DE PANTALLA CHECADOR");
        console.log("Obteniendo ubicación inicial...");

        //Obtener ubicación del dispositivo
        const ubicacionDispositivo = await obtenerUbicacion();

        if (!ubicacionDispositivo) {
          console.warn("No se pudo obtener ubicación inicial");
          setIsLoadingUbicacion(false);
          return;
        }
        const { latitude, longitude } = ubicacionDispositivo;
        console.log(" Ubicación obtenida:", { latitude, longitude });

        //Guarda ubicación
        setUbicacionActual({
          latitude,
          longitude,
        });

        //Obtener dirección
        const direccion = await detalleUbicacion({
          latitude,
          longitude,
        });

        //console.log("Dirección obtenida:", direccion);

        //Guardar dirección en estado
        setDireccionActual(direccion);
      } catch (error) {
        console.error("Error al obtener ubicación inicial:", error);
      } finally {
        setIsLoadingUbicacion(false);
      }
    };

    obtenerUbicacionInicial();
  }, []);

  // Timer para actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar estado guardado al iniciar
  useEffect(() => {
    cargarEstadoFlujo();
  }, []);

  // Guardar estado cuando cambie
  useEffect(() => {
    guardarEstadoFlujo(flujoEstado);
  }, [flujoEstado]);
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  const cargarEstadoFlujo = async () => {
    try {
      const saved = await AsyncStorage.getItem("@flujo_estado");
      if (saved) {
        setFlujoEstado(saved as flujoEstado);
      }
    } catch (error) {
      console.error("Error cargando estado:", error);
    }
  };

  const guardarEstadoFlujo = async (state: flujoEstado) => {
    try {
      await AsyncStorage.setItem("@flujo_estado", state);
    } catch (error) {
      console.error("Error guardando estado:", error);
    }
  };

  // Verificar si un botón debe estar habilitado
  const esBotonHabilitado = (type: CheckType): boolean => {
    switch (flujoEstado) {
      case "initial":
        return type === "inicio_jornada";
      case "jornada_iniciada":
        return type === "inicio_comida" || type === "fin_jornada";
      case "comida_iniciada":
        return type === "fin_comida";
      case "comida_terminada":
        return type === "fin_jornada";
      case "jornada_terminada":
      case "bloqueado":
        return false;

      default:
        return false;
    }
  };

  // Obtener el siguiente estado después de una checada
  const obtenerSiguienteEstado = (type: CheckType): flujoEstado => {
    switch (type) {
      case "inicio_jornada":
        return "jornada_iniciada";
      case "inicio_comida":
        return "comida_iniciada";
      case "fin_comida":
        return "comida_terminada";
      case "fin_jornada":
        return "jornada_terminada";
      default:
        return flujoEstado;
    }
  };
  // Obtener el id del estado a enviar
  const obtenerIdTipoChecada = (type: CheckType) => {
    switch (type) {
      case "inicio_jornada":
        return 1;
      case "inicio_comida":
        return 2;
      case "fin_comida":
        return 3;
      case "fin_jornada":
        return 4;
      default:
        return 0;
    }
  };

  // Formatear la hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };
  //Formatear la fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const checadaOpciones = [
    {
      id: "inicio_jornada" as CheckType,
      label: "Inicio de Jornada",
      icon: "log-in-outline",
      color: "#4CAF50",
      bgColor: "rgba(76, 175, 80, 0.1)",
    },
    {
      id: "inicio_comida" as CheckType,
      label: "Inicio de Comida",
      icon: "restaurant-outline",
      color: "#FF9800",
      bgColor: "rgba(255, 152, 0, 0.1)",
    },
    {
      id: "fin_comida" as CheckType,
      label: "Fin de Comida",
      icon: "restaurant",
      color: "#2196F3",
      bgColor: "rgba(33, 150, 243, 0.1)",
    },
    {
      id: "fin_jornada" as CheckType,
      label: "Fin de Jornada",
      icon: "log-out-outline",
      color: "#F44336",
      bgColor: "rgba(244, 67, 54, 0.1)",
    },
  ];

  //Obtiene coordenadas de la ubicacion para procesar
  const obtenerUbicacion = async () => {
    try {
      //Modal de carga
      setLoadingText("Obteniendo Ubicación...");
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      console.log("Status: ", status);

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

      // console.log("###### DATOS OBTENIDOS DE LOCATION :###### \n");
      // console.log("Ubicación completa:", JSON.stringify(location, null, 2));
      setIsLoading(false);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la ubicación");
      return null;
    }
  };

  //Obtenemos detalle de la ubicacion (direccion,calle,etc.)
  const detalleUbicacion = async (ubicacionDispositivo: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const { latitude, longitude } = ubicacionDispositivo;

      // console.log("Coordenadas a enviar:", { latitude, longitude });

      const reverseGeocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      // Verificar si hay resultados
      if (reverseGeocodeResult && reverseGeocodeResult.length > 0) {
        const direccion = reverseGeocodeResult[0];

        // Construir dirección formateada
        const direccionFormateada = [
          direccion.street,
          direccion.district,
          direccion.postalCode,
          direccion.city || direccion.region,
        ]
          .filter(Boolean)
          .join(", ");

        // console.log("Dirección formateada:", direccionFormateada);

        // Retornar la dirección completa
        return {
          direccionCompleta: direccionFormateada,
          calle: direccion.street || "",
          colonia: direccion.district || "",
          ciudad: direccion.city || direccion.region || "",
          region: direccion.region || "",
          codigoPostal: direccion.postalCode || "",
          pais: direccion.country || "",
          nombre: direccion.name || "",
          raw: direccion, // Objeto con direccion completa por si se necesita
        };
      } else {
        console.warn("No se encontró dirección para estas coordenadas");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener dirección:", error);

      // Manejo específico de errores
      if (error instanceof Error) {
        if (error.message.includes("network")) {
          Alert.alert(
            "Error de conexión",
            "No hay conexión a internet para obtener la dirección",
          );
        } else {
          Alert.alert(
            "Error",
            "No se pudo obtener la dirección de la ubicación",
          );
        }
      }
      return null;
    }
  };

  //Validar Checada
  const handleCheck = async (type: CheckType) => {
    setLoadingText("Procesando checada...");
    // Valida tener ubicacion
    if (!ubicacionActual) {
      Alert.alert(
        "Error",
        "No se pudo obtener la ubicación. Por favor, intenta nuevamente.",
      );
      return;
    }
    //Modal de carga
    setIsLoading(true);

    try {
      const { latitude, longitude } = ubicacionActual;

      // Registrar checada con los datos almacenados
      await registrarChecada(type, latitude, longitude, direccionActual);
    } catch (error) {
      console.error("Error en handleCheck:", error);
      Alert.alert("Error", "Error al registrar checada");
    } finally {
      setIsLoading(false);
    }
  };

  const registrarChecada = async (
    type: CheckType,
    latitude: number,
    longitude: number,
    direccionUbicacion: any,
  ) => {
    setIsLoading(false);
    //Alerta de confirmacion
    const idTipoChecada = obtenerIdTipoChecada(type);

    const checkLabel =
      checadaOpciones.find((opt) => opt.id === type)?.label || "";
    Alert.alert(
      "Confirmar Checada",
      `¿Estás seguro de registrar "${checkLabel}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setIsLoading(true);

              // Datos para el backend
              const payload = {
                usuario_id: 10, //DUMMY
                tipo_checada: idTipoChecada,
                ubicacion: {
                  latitud: latitude,
                  longitud: longitude,
                  direccionCompleta: direccionUbicacion,
                },
              };

              console.log(JSON.stringify(payload, null, 2));

              // Peticion a la API
              const response = await fetch(
                `${API_BASE_URL}/api/v1/checador/registrar-checada`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                },
              );

              const responseData = await response.json();
              console.log("Respuesta del servidor:", responseData);

              //extraer respuesa de servidor
              const { body } = responseData;
              const statusCode = body?.status_code;
              const message = body?.message;

              if (statusCode == STATUS_CODES.CODE_200) {
                const now = new Date();
                setLastCheck({
                  type,
                  time: now.toLocaleTimeString(),
                });
                setIsLoading(false);
                //Actualizar estado del flujo
                const sigEstado = obtenerSiguienteEstado(type);
                setFlujoEstado(sigEstado);

                Alert.alert(
                  "Éxito",
                  `${checkLabel} registrada correctamente\n\n Nota:\n ${message}`,
                );
              } else {
                setIsLoading(false);
                const mensajeError = message || "Error al registrar";
                Alert.alert("Error", mensajeError);
              }
            } catch (error) {
              setIsLoading(false);
              console.error("Error en la petición:", error);
              let mensajeError = "Error al registrar checada";
              if (error instanceof Error) {
                if (error.message.includes("Network request failed")) {
                  mensajeError =
                    "No se pudo conectar al servidor. Verifica tu conexión.";
                } else {
                  mensajeError = error.message;
                }
              }
              Alert.alert("Error", mensajeError);
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    try {
      //Scroll de refresh de pantalla
      setRefreshing(true);
      setLoadingText("Refrescando datos...");
      const ubicacionDispositivo = await obtenerUbicacion();
      if (ubicacionDispositivo) {
        const { latitude, longitude } = ubicacionDispositivo;

        // Actualizar estado de ubicación
        setUbicacionActual({ latitude, longitude });

        // Recargar dirección
        const direccion = await detalleUbicacion({ latitude, longitude });
        setDireccionActual(direccion);
      } else {
        console.warn("⚠️ No se pudo obtener ubicación en refresh");
      }
      setRefreshing(false);
    } catch (error) {
      console.error("Error en refresh:", error);
      Alert.alert("Error", "No se pudo actualizar los datos");
    } finally {
      setRefreshing(false);
      setLoadingText("Procesando checada...");
    }
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
              {checadaOpciones.find((opt) => opt.id === lastCheck.type)?.label}{" "}
              - {lastCheck.time}
            </Text>
          </View>
        )}

        {/* Contenedor horario */}
        <View
          style={[styles.timerContainer, { backgroundColor: theme.surface }]}
        >
          {/* Hora actual */}
          <Text style={[styles.currentTime, { color: theme.text }]}>
            {formatTime(currentTime)}
          </Text>

          {/* Fecha actual */}
          <Text style={[styles.currentDate, { color: theme.textSecondary }]}>
            {formatDate(currentTime)}
          </Text>
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
          {checadaOpciones.map((option) => {
            const estaHabilitado = esBotonHabilitado(option.id);

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.checkCard,
                  {
                    backgroundColor: estaHabilitado
                      ? option.bgColor
                      : "#f0f0f0",
                    borderColor: estaHabilitado ? option.color : "#ddd",
                    borderWidth: 1.5,
                    opacity: estaHabilitado ? 1 : 0.5,
                  },
                ]}
                onPress={() => handleCheck(option.id)}
                disabled={!estaHabilitado || isLoading}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: estaHabilitado
                        ? option.color + "20"
                        : "#e0e0e0",
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={32}
                    color={estaHabilitado ? option.color : "#999"}
                  />
                </View>
                <Text
                  style={[
                    styles.checkLabel,
                    { color: estaHabilitado ? option.color : "#999" },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal de carga */}
      <LoadingOverlay
        visible={isLoading || refreshing}
        text={loadingText}
        iconName={refreshing ? "sync-outline" : "sync-outline"}
      />
    </SafeAreaView>
  );
}
//Estilos de la pantallas
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
    timerContainer: {
      alignItems: "center",
      paddingVertical: 30,
      marginHorizontal: 3,
      marginTop: 10,
      borderRadius: 20,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    currentTime: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.text,
      letterSpacing: 2,
      marginBottom: 10,
    },
    currentDate: {
      fontSize: 22,
      color: colors.textSecondary,
      marginBottom: 1,
      textTransform: "capitalize",
    },
  });
