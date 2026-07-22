// app/historial/index.tsx
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { getApiUrl } from "../../config/configApiURL";
import { STATUS_CODES } from "../../constants/messages";

import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
//Ajuste zona horaria
dayjs.extend(utc);
dayjs.extend(timezone);

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

type CheckType =
  | "inicio_jornada"
  | "inicio_comida"
  | "fin_comida"
  | "fin_jornada";

// Interfaz para los datos del servidor
interface HistorialItem {
  id_usuario: number;
  id_jornada: number;
  id_jornada_detalle: number;
  id_tipo_checada: number;
  tipo_checada_descripcion: string;
  id_tipo_puntualidad: number;
  coordenadas_latitud: string;
  coordenadas_longitud: string;
  direccion_ubicacion: string;
  fecha_registro: string;
}

// Interfaz para los datos mapeados que usa la UI
interface HistorialUIItem {
  id: number;
  tipo: CheckType;
  fecha: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  idTipoPuntualidad: number;
}

export default function HistorialScreen() {
  const { theme, isDarkMode } = useTheme();

  // Estados
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateType, setSelectedDateType] = useState<"inicio" | "fin">(
    "inicio",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [historialData, setHistorialData] = useState<HistorialUIItem[]>([]);

  const API_BASE_URL = getApiUrl();

  // Función para mapear datos del servidor al formato de la UI
  const mapearDatosHistorial = (
    dataFromServer: HistorialItem[],
  ): HistorialUIItem[] => {
    if (!dataFromServer || dataFromServer.length === 0) return [];

    return dataFromServer.map((item) => ({
      id: item.id_jornada_detalle || item.id_jornada,
      tipo: item.tipo_checada_descripcion as CheckType,
      fecha: item.fecha_registro,
      ubicacion: item.direccion_ubicacion || "Ubicación no disponible",
      latitud: item.coordenadas_latitud,
      longitud: item.coordenadas_longitud,
      idTipoPuntualidad: item.id_tipo_puntualidad,
    }));
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    const usuarioId = 10;
    const fechaActual = obtenerFechaLocal();
    // Establecer en filtros
    setFechaInicio(fechaActual);
    setFechaFin(fechaActual);
    console.log("fechaActual ", fechaActual);

    // Cargar historial
    obtenerHistorialChecadas(usuarioId, fechaActual, fechaActual);
  }, []);

  // Obtener historial de checadas
  const obtenerHistorialChecadas = async (
    idUsuario: number,
    fecInicio: string,
    fecFinal: string,
  ) => {
    setIsLoading(true);
    try {
      // Construir URL con query parameters
      const url = new URL(`${API_BASE_URL}/api/v1/checador/historial-checadas`);
      url.searchParams.append("usuario_id", idUsuario.toString());
      url.searchParams.append("rango_fecha_inicio", fecInicio);
      url.searchParams.append("rango_fecha_fin", fecFinal);

      console.log("URL:", url.toString());

      // Peticion API
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();
      console.log(
        "Respuesta del servidor:",
        JSON.stringify(responseData, null, 2),
      );

      // Extraer datos de la respuesta
      const { body } = responseData;
      const statusCode = body?.status_code;
      const message = body?.message;
      const data = body?.data || [];

      if (statusCode === STATUS_CODES.CODE_200) {
        const datosMapeados = mapearDatosHistorial(data);
        setHistorialData(datosMapeados);
        console.log(`Se encontraron ${datosMapeados.length} registros`);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        const mensajeError = message || "Error al obtener historial";
        Alert.alert("Error", mensajeError);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error en la petición:", error);
      let mensajeError = "Error al obtener historial";
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
  };

  // obtener fecha actual
  const obtenerFechaLocal = (diasOffset: number = 0): string => {
    return dayjs()
      .tz("America/Mexico_City")
      .add(diasOffset, "day")
      .format("YYYY-MM-DD");
  };

  // formatear fecha: "DIA-MES-AÑO"
  const formatearFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const formatearFechaSimple = (fechaISO: string) => {
    const [year, month, day] = fechaISO.split("-");
    return `${day}-${month}-${year}`;
  };

  // formatear hora
  const formatearTiempo = (fechaISO: string) => {
    const date = new Date(fechaISO);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // obtener el icono y color según el tipo checada
  const getTipoInfo = (tipo: CheckType) => {
    const opcion = checadaOpciones.find((opt) => opt.id === tipo);
    return opcion || checadaOpciones[0];
  };

  // Filtrar datos por rango de fechas
  const obtenerFechaFiltrada = () => {
    if (!fechaInicio && !fechaFin) return historialData;

    const parseLocalDate = (fechaStr: string, endOfDay = false) => {
      const [year, month, day] = fechaStr.split("-").map(Number);
      return endOfDay
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day, 0, 0, 0, 0);
    };
    return historialData.filter((item) => {
      const itemDate = new Date(item.fecha);

      if (fechaInicio && fechaFin) {
        const start = parseLocalDate(fechaInicio);
        const end = parseLocalDate(fechaFin, true);
        return itemDate >= start && itemDate <= end;
      }

      if (fechaInicio) {
        return itemDate >= parseLocalDate(fechaInicio);
      }

      if (fechaFin) {
        return itemDate <= parseLocalDate(fechaFin, true);
      }

      return true;
    });
  };

  const filteredData = obtenerFechaFiltrada();

  //Seleccion de filtros
  const handleFechaHoy = () => {
    const today = obtenerFechaLocal(0);
    console.log("Seleccionando HOY:", today);
    actualizarFecha(today);
  };

  const handleFechaAyer = () => {
    const fecAyer = obtenerFechaLocal(-1);
    console.log("Fecha AYER: ", fecAyer);
    actualizarFecha(fecAyer);
  };

  const handleFecha7Dias = () => {
    const fec7Dias = obtenerFechaLocal(-7);
    console.log("Fecha 7 dias: ", fec7Dias);
    actualizarFecha(fec7Dias);
  };

  const handleFecha30Dias = () => {
    const fec30Dias = obtenerFechaLocal(-30);
    console.log("Fecha 30 dias: ", fec30Dias);
    actualizarFecha(fec30Dias);
  };

  // aux fechas
  const actualizarFecha = (date: string) => {
    if (selectedDateType === "inicio") {
      setFechaInicio(date);
    } else {
      setFechaFin(date);
    }
    setShowDatePicker(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    if (fechaInicio && fechaFin) {
      const usuarioId = 10; // Obtener del contexto
      obtenerHistorialChecadas(usuarioId, fechaInicio, fechaFin);
    } else {
      Alert.alert("Información", "Selecciona ambas fechas para filtrar");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header con botón de retroceso */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Historial de Checadas
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtros de calendario */}
      <View
        style={[styles.filtrosContainer, { borderBottomColor: theme.border }]}
      >
        <View style={styles.filtrosRow}>
          <TouchableOpacity
            style={[
              styles.filtroInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              setSelectedDateType("inicio");
              setShowDatePicker(true);
            }}
          >
            <Text style={[styles.filtroLabel, { color: theme.textSecondary }]}>
              Desde
            </Text>
            <Text style={[styles.filtroValue, { color: theme.text }]}>
              {fechaInicio
                ? formatearFechaSimple(fechaInicio)
                : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filtroInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              setSelectedDateType("fin");
              setShowDatePicker(true);
            }}
          >
            <Text style={[styles.filtroLabel, { color: theme.textSecondary }]}>
              Hasta
            </Text>
            <Text style={[styles.filtroValue, { color: theme.text }]}>
              {fechaFin ? formatearFechaSimple(fechaFin) : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtrosActions}>
          <TouchableOpacity
            style={[styles.limpiarButton, { borderColor: theme.border }]}
            onPress={limpiarFiltros}
          >
            <Text style={[styles.limpiarText, { color: theme.textSecondary }]}>
              Limpiar filtros
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aplicarButton, { backgroundColor: theme.primary }]}
            onPress={aplicarFiltros}
          >
            <Text style={styles.aplicarText}>Buscar</Text>
          </TouchableOpacity>

          <Text style={[styles.contadorText, { color: theme.textSecondary }]}>
            {filteredData.length} registros
          </Text>
        </View>
      </View>

      {/* Contenido */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando historial...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjetas de historial */}
          {filteredData.length > 0 ? (
            filteredData.map((item) => {
              const tipoInfo = getTipoInfo(item.tipo);
              const fechaFormateada = formatearFecha(item.fecha);
              const horaFormateada = formatearTiempo(item.fecha);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Icono */}
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: tipoInfo.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={tipoInfo.icon as any}
                      size={24}
                      color={tipoInfo.color}
                    />
                  </View>

                  {/* Información */}
                  <View style={styles.infoContainer}>
                    <Text style={[styles.cardTipo, { color: theme.text }]}>
                      {tipoInfo.label}
                    </Text>
                    <Text
                      style={[styles.cardFecha, { color: theme.textSecondary }]}
                    >
                      Fecha: {fechaFormateada}
                    </Text>
                    <Text
                      style={[
                        styles.cardUbicacion,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.ubicacion}
                    </Text>
                  </View>

                  {/* Hora */}
                  <View style={styles.horaContainer}>
                    <Text style={[styles.cardHora, { color: theme.primary }]}>
                      {horaFormateada}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={60}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No hay registros en este rango de fechas
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal para seleccionar fecha */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Seleccionar fecha
              </Text>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={handleFechaHoy}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  Hoy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={handleFechaAyer}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  Ayer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={handleFecha7Dias}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  Hace 7 días
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={handleFecha30Dias}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  Hace 30 días
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => {
                  if (selectedDateType === "inicio") {
                    setFechaInicio("");
                  } else {
                    setFechaFin("");
                  }
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.danger }]}>
                  Limpiar fecha
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filtrosContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filtrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  filtroInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  filtroLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  filtroValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  filtrosActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  limpiarButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  limpiarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  aplicarButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
  },
  aplicarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  contadorText: {
    fontSize: 13,
    marginLeft: "auto",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
  },
  cardTipo: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardFecha: {
    fontSize: 13,
    marginBottom: 6,
  },
  cardUbicacion: {
    fontSize: 12,
  },
  horaContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  cardHora: {
    fontSize: 15,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  modalCancelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
