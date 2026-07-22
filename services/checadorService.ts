// src/services/checadorService.ts
import { apiClient } from "../api/client";

// cuerpo de envio POST
export interface ChecadaPayload {
  usuario_id: number;
  tipo_checada: number;
  ubicacion: {
    latitud: number;
    longitud: number;
    direccionCompleta: any;
  };
}

export interface ChecadaResponse {
  body: {
    status_code: number;
    message: string;
  };
}

export const checadorService = {
  registrarChecada: async (
    payload: ChecadaPayload,
  ): Promise<ChecadaResponse> => {
    const response = await apiClient.post<ChecadaResponse>(
      "/api/v1/checador/registrar-checada",
      payload,
    );
    return response.data;
  },
};
