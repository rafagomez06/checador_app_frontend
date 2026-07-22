// src/services/checadorService.ts
import { apiClient } from "../api/client";

//Parametros enviados en GET
export interface HistorialParams {
  usuario_id: number;
  rango_fecha_inicio: string;
  rango_fecha_fin: string;
}
//Cuerpo de response
export interface HistorialItemResponse {
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
//Cuerpo completo response
export interface HistorialResponseBody {
  status_code: number;
  status_message?: string;
  message: string;
  data: HistorialItemResponse[];
}

export interface HistorialResponse {
  body: HistorialResponseBody;
}

export const historialService = {
  obtenerHistorial: async (
    params: HistorialParams,
  ): Promise<HistorialResponse> => {
    const response = await apiClient.get<HistorialResponse>(
      "/api/v1/checador/historial-checadas",
      { params },
    );
    return response.data;
  },
};
