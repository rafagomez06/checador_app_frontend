// src/hooks/useHistorialChecadas.ts
import { useState } from "react";
import { STATUS_CODES } from "../constants/messages";
import {
    HistorialItemResponse,
    HistorialParams,
    historialService,
} from "../services/historialService";

export const useHistorialChecadas = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistorialItemResponse[]>([]);

  const obtenerHistorial = async (params: HistorialParams) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("PETICION");
      const response = await historialService.obtenerHistorial(params);

      if (response.body?.status_code === STATUS_CODES.CODE_200) {
        setData(response.body.data || []);
        return { success: true, message: response.body.message };
      } else {
        const errorMsg =
          response.body?.message || "Error al obtener el historial";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      let errorMessage = "Error al conectar con el servidor";

      if (
        err.message?.includes("Network Error") ||
        err.message?.includes("Network request failed")
      ) {
        errorMessage = "No hay conexión a internet. Verifica tu red.";
      } else if (err.response?.data?.body?.message) {
        errorMessage = err.response.data.body.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, data, obtenerHistorial };
};
