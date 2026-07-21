import { Platform } from "react-native";

// Configuración de URL
export const getApiUrl = () => {
  if (__DEV__) {
    const LOCAL_IP = "http://192.168.11.144:5000";

    // Para emulador Android
    if (Platform.OS === "android") {
      return "http://10.0.2.2:5000";
    }
    // Para simulador iOS o web
    return LOCAL_IP;
  }
  // Producción
  return "https://tu-api-produccion.com";
};
