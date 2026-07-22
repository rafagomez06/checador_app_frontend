// app/(tabs)/checador/index.tsx
import LoadingOverlay from "@/components/LoadingOverlay";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
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
import { STATUS_CODES } from "../../constants/messages";
import { checadasLocalDB } from "../../database/database";
import { obtenerFechaLocal } from "../../helpers/helpers";
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

// Mapeo de tipos de checada
const TIPO_CHECADA_MAP = {
  inicio_jornada: 1,
  inicio_comida: 2,
  fin_comida: 3,
  fin_jornada: 4,
};

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
  const [pendientesCount, setPendientesCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const API_BASE_URL = getApiUrl();
  const styles = getStyles(theme);

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // INICIALIZACIÓN
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

  // Limpiar estado para pruebas (eliminar en producción)
  useEffect(() => {
    console.log("ELIMINANDO ESTADO PARA PRUEBAS");
    AsyncStorage.clear();
  }, []);

  // Monitorear estado de red
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(connected || false);

      if (connected) {
        console.log("📶 Conexión restablecida, verificando pendientes...");
        actualizarContadorPendientes();
      }
    });

    return () => unsubscribe();
  }, []);

  // Obtener ubicación al renderizar
  useEffect(() => {
    const obtenerUbicacionInicial = async () => {
      try {
        console.log("RENDERIZADO DE PANTALLA CHECADOR");
        console.log("Obteniendo ubicación inicial...");

        const ubicacionDispositivo = await obtenerUbicacion();

        if (!ubicacionDispositivo) {
          console.warn("No se pudo obtener ubicación inicial");
          setIsLoadingUbicacion(false);
          return;
        }
        const { latitude, longitude } = ubicacionDispositivo;
        console.log(" Ubicación obtenida:", { latitude, longitude });

        setUbicacionActual({ latitude, longitude });

        const direccion = await detalleUbicacion({ latitude, longitude });
        setDireccionActual(direccion);
      } catch (error) {
        console.error("Error al obtener ubicación inicial:", error);
      } finally {
        setIsLoadingUbicacion(false);
      }
    };

    obtenerUbicacionInicial();
    actualizarContadorPendientes();
  }, []);

  // Timer para actualizar la hora
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
  // FUNCIONES DE ESTADO
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

  const actualizarContadorPendientes = async () => {
    try {
      const count = await checadasLocalDB.contarPendientes();
      setPendientesCount(count);
      console.log(`Checadas pendientes: ${count}`);
    } catch (error) {
      console.error("Error al contar pendientes:", error);
    }
  };

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // FUNCIONES DE VALIDACIÓN
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

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

  const obtenerIdTipoChecada = (type: CheckType): number => {
    return TIPO_CHECADA_MAP[type] || 0;
  };

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // FUNCIONES DE UBICACIÓN
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

  const obtenerUbicacion = async () => {
    try {
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

  const detalleUbicacion = async (ubicacionDispositivo: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const { latitude, longitude } = ubicacionDispositivo;

      const reverseGeocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodeResult && reverseGeocodeResult.length > 0) {
        const direccion = reverseGeocodeResult[0];

        const direccionFormateada = [
          direccion.street,
          direccion.district,
          direccion.postalCode,
          direccion.city || direccion.region,
        ]
          .filter(Boolean)
          .join(", ");

        return {
          direccionCompleta: direccionFormateada,
          calle: direccion.street || "",
          colonia: direccion.district || "",
          ciudad: direccion.city || direccion.region || "",
          region: direccion.region || "",
          codigoPostal: direccion.postalCode || "",
          pais: direccion.country || "",
          nombre: direccion.name || "",
          raw: direccion,
        };
      } else {
        console.warn("No se encontró dirección para estas coordenadas");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      return null;
    }
  };

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // FUNCIÓN PRINCIPAL: REGISTRAR CHECADA CON MODO OFFLINE
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

  const handleCheck = async (type: CheckType) => {
    // Validar ubicación
    if (!ubicacionActual) {
      Alert.alert(
        "Error",
        "No se pudo obtener la ubicación. Por favor, intenta nuevamente.",
      );
      return;
    }

    const idTipoChecada = obtenerIdTipoChecada(type);
    const checkLabel =
      checadaOpciones.find((opt) => opt.id === type)?.label || "";

    // Alerta de confirmación
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
              setLoadingText("Procesando checada...");

              const { latitude, longitude } = ubicacionActual;
              const fechaRegistro = obtenerFechaLocal();
              const usuarioId = 10; // DUMMY - Obtener del contexto de autenticación

              // Preparar datos para guardar localmente
              const checadaLocal = {
                usuario_id: usuarioId,
                tipo_checada: idTipoChecada,
                latitud: latitude.toString(),
                longitud: longitude.toString(),
                fecha_registro: fechaRegistro,
                sincronizado: false,
                intentos_reintentos: 0,
              };

              // 1️⃣ GUARDAR LOCALMENTE SIEMPRE
              const idLocal = await checadasLocalDB.guardar(checadaLocal);
              console.log(`✅ Checada guardada localmente con ID: ${idLocal}`);

              // Actualizar UI
              const now = new Date();
              setLastCheck({
                type,
                time: now.toLocaleTimeString(),
              });

              // Actualizar estado del flujo
              const sigEstado = obtenerSiguienteEstado(type);
              setFlujoEstado(sigEstado);

              // 2️⃣ VERIFICAR CONEXIÓN
              const netInfo = await NetInfo.fetch();
              const tieneConexion =
                netInfo.isConnected && netInfo.isInternetReachable;

              if (tieneConexion) {
                // 3️⃣ INTENTAR SINCRONIZAR INMEDIATAMENTE
                try {
                  setLoadingText("Sincronizando con servidor...");

                  const payload = {
                    usuario_id: usuarioId,
                    tipo_checada: idTipoChecada,
                    coordenadas_latitud: latitude.toString(),
                    coordenadas_longitud: longitude.toString(),
                    direccion_ubicacion:
                      direccionActual?.direccionCompleta || "",
                    fecha_registro: fechaRegistro,
                  };

                  const response = await fetch(
                    `${API_BASE_URL}/api/v1/checador/registrar-checada-offline`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    },
                  );

                  if (response.ok) {
                    const responseData = await response.json();
                    const { body } = responseData;

                    if (body?.status_code === STATUS_CODES.CODE_200) {
                      // Marcar como sincronizada y mover a historial
                      await checadasLocalDB.marcarSincronizada(idLocal);
                      await checadasLocalDB.moverAHistorial(idLocal);
                      console.log(
                        `✅ Checada ${idLocal} sincronizada con el servidor`,
                      );

                      Alert.alert(
                        "Éxito",
                        `${checkLabel} registrada y sincronizada correctamente`,
                      );
                    } else {
                      Alert.alert(
                        "Éxito (Offline)",
                        `${checkLabel} registrada localmente. Se sincronizará automáticamente.`,
                      );
                    }
                  } else {
                    // La API respondió con error, pero la checada está guardada localmente
                    Alert.alert(
                      "Éxito (Offline)",
                      `${checkLabel} registrada localmente. Se sincronizará automáticamente.`,
                    );
                  }
                } catch (syncError) {
                  console.warn(
                    "⚠️ Error al sincronizar, se guardará localmente:",
                    syncError,
                  );
                  Alert.alert(
                    "Éxito (Offline)",
                    `${checkLabel} registrada localmente. Se sincronizará automáticamente.`,
                  );
                }
              } else {
                // 4️⃣ SIN CONEXIÓN - Solo guardado local
                Alert.alert(
                  "📴 Modo Offline",
                  `${checkLabel} registrada localmente.\nSe sincronizará automáticamente cuando tengas conexión.`,
                  [{ text: "OK" }],
                );
              }

              // Actualizar contador de pendientes
              await actualizarContadorPendientes();
            } catch (error) {
              console.error("Error en handleCheck:", error);
              Alert.alert("Error", "No se pudo registrar la checada");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // REFRESH
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setLoadingText("Refrescando datos...");

      // Actualizar ubicación
      const ubicacionDispositivo = await obtenerUbicacion();
      if (ubicacionDispositivo) {
        const { latitude, longitude } = ubicacionDispositivo;
        setUbicacionActual({ latitude, longitude });
        const direccion = await detalleUbicacion({ latitude, longitude });
        setDireccionActual(direccion);
      }

      // Actualizar contador de pendientes
      await actualizarContadorPendientes();

      // Verificar conexión y sincronizar si es posible
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        setLoadingText("Sincronizando pendientes...");
        // Importar y ejecutar sincronización
        const SyncService = (await import("../../services/Sincronizacion"))
          .default;
        const { sincronizadas, fallidas } =
          await SyncService.sincronizarForzada();
        console.log(
          `✅ Sincronización forzada: ${sincronizadas} exitosas, ${fallidas} fallidas`,
        );
        await actualizarContadorPendientes();
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

  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  // RENDER
  // =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

  // Formateo de fechas
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
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

        {/* Indicador de estado offline/pendientes */}
        {!isOnline && (
          <View
            style={[styles.offlineIndicator, { backgroundColor: "#FF9800" }]}
          >
            <Ionicons name="wifi-outline" size={16} color="#FFF" />
            <Text style={styles.offlineText}>Sin conexión - Modo offline</Text>
          </View>
        )}

        {pendientesCount > 0 && isOnline && (
          <TouchableOpacity
            style={[
              styles.pendientesIndicator,
              { backgroundColor: theme.primaryLight },
            ]}
            onPress={onRefresh}
          >
            <Ionicons name="sync-outline" size={16} color={theme.primary} />
            <Text style={[styles.pendientesText, { color: theme.primary }]}>
              {pendientesCount} checadas pendientes de sincronizar
            </Text>
          </TouchableOpacity>
        )}

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
          <Text style={[styles.currentTime, { color: theme.text }]}>
            {formatTime(currentTime)}
          </Text>
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
                      : theme.surface,
                    borderColor: estaHabilitado ? option.color : theme.border,
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
                        : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={32}
                    color={estaHabilitado ? option.color : theme.textTertiary}
                  />
                </View>
                <Text
                  style={[
                    styles.checkLabel,
                    {
                      color: estaHabilitado ? option.color : theme.textTertiary,
                    },
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

// =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
// ESTILOS
// =+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

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
    offlineIndicator: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
      justifyContent: "center",
    },
    offlineText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 8,
    },
    pendientesIndicator: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    pendientesText: {
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 8,
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
