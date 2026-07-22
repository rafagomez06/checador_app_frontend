// services/Sincronizacion.ts
import NetInfo from "@react-native-community/netinfo";
import { getApiUrl } from "../config/configApiURL";
import { ChecadaLocal, checadasLocalDB } from "../database/database";

const API_BASE_URL = getApiUrl();

class Sincronizacion {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  // Iniciar el servicio de sincronización
  startSyncService() {
    console.log("Iniciando servicio de sincronización...");

    // Escuchar cambios de conectividad
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("Conexión detectada, sincronizando...");
        this.sincronizarPendientes();
      }
    });

    // Sincronizar cada 5 minutos si hay conexión
    this.syncInterval = setInterval(
      () => {
        this.sincronizarPendientes();
      },
      5 * 60 * 1000,
    ); // 5 minutos

    // Sincronización inicial
    this.sincronizarPendientes();
  }

  // Detener el servicio
  stopSyncService() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sincronizar checadas pendientes
  async sincronizarPendientes() {
    // Evitar sincronizaciones concurrentes
    if (this.isSyncing) {
      console.log("Sincronización en curso, omitiendo...");
      return;
    }

    try {
      // Verificar conexión
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.log("Sin conexión, sincronización pospuesta");
        return;
      }

      this.isSyncing = true;
      console.log("Iniciando sincronización de checadas pendientes...");

      // Obtener checadas pendientes
      const pendientes = await checadasLocalDB.obtenerPendientes();

      if (pendientes.length === 0) {
        console.log("No hay checadas pendientes de sincronizar");
        this.isSyncing = false;
        return;
      }

      console.log(`Sincronizando ${pendientes.length} checadas...`);

      // Procesar cada checada
      for (const checada of pendientes) {
        try {
          // Enviar al backend
          const success = await this.enviarChecada(checada);

          if (success) {
            // Marcar como sincronizada y mover a historial
            await checadasLocalDB.marcarSincronizada(checada.id!);
            await checadasLocalDB.moverAHistorial(checada.id!);
            console.log(`Checada ${checada.id} sincronizada exitosamente`);
          } else {
            // Incrementar intentos
            await checadasLocalDB.incrementarIntentos(checada.id!);
            console.warn(
              `Error al sincronizar checada ${checada.id}, reintentando después`,
            );
          }
        } catch (error) {
          console.error(`Error al sincronizar checada ${checada.id}:`, error);
          await checadasLocalDB.incrementarIntentos(checada.id!);
        }
      }

      console.log("Sincronización completada");
    } catch (error) {
      console.error("Error en el proceso de sincronización:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Enviar una checada al backend
  private async enviarChecada(checada: ChecadaLocal): Promise<boolean> {
    try {
      // Datos para el backend
      const payload = {
        usuario_id: checada.usuario_id,
        tipo_checada: checada.tipo_checada,
        ubicacion: {
          latitud: checada.latitud,
          longitud: checada.longitud,
        },
        fecha_registro: checada.fecha_registro,
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
        const data = await response.json();
        return data.body?.status_code === 200;
      }

      return false;
    } catch (error) {
      console.error("Error al enviar checada:", error);
      return false;
    }
  }

  // Sincronización forzada (pull-to-refresh)
  async sincronizarForzada(): Promise<{
    sincronizadas: number;
    fallidas: number;
  }> {
    const pendientes = await checadasLocalDB.obtenerPendientes();
    let sincronizadas = 0;
    let fallidas = 0;

    for (const checada of pendientes) {
      const success = await this.enviarChecada(checada);
      if (success) {
        await checadasLocalDB.marcarSincronizada(checada.id!);
        await checadasLocalDB.moverAHistorial(checada.id!);
        sincronizadas++;
      } else {
        fallidas++;
      }
    }

    return { sincronizadas, fallidas };
  }
}

export default new Sincronizacion();
