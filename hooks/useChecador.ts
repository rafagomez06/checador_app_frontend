// src/hooks/useChecador.ts
import { useState } from "react";
import { STATUS_CODES } from "../constants/messages";
import { ChecadaPayload, checadorService } from "../services/checadorService";

export const useChecador = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  const registrar = async (payload: ChecadaPayload) => {
    setIsRegistering(true);
    try {
      const response = await checadorService.registrarChecada(payload);
      //Validamos respuesta de servidor
      if (response.body?.status_code === STATUS_CODES.CODE_200) {
        return { success: true, message: response.body.message };
      } else {
        return {
          success: false,
          message: response.body?.message || "Error del servidor",
        };
      }
    } catch (error: any) {
      let errorMessage = "Error al conectar con el servidor";
      if (error.message.includes("Network Error")) {
        errorMessage = "No hay conexión a internet. Verifica tu red.";
      } else if (error.response?.data?.body?.message) {
        errorMessage = error.response.data.body.message;
      }

      return { success: false, message: errorMessage };
    } finally {
      setIsRegistering(false);
    }
  };

  return { isRegistering, registrar };
};
