// database/database.ts
import * as SQLite from "expo-sqlite";

// Creamos la BD Local
const db = SQLite.openDatabaseSync("checador.db");

// Tipo para las checadas
export interface ChecadaLocal {
  id?: number;
  usuario_id: number;
  tipo_checada: number;
  latitud: string;
  longitud: string;
  fecha_registro: string;
  sincronizado: boolean;
  intentos_reintentos: number;
  created_at?: string;
}

// Inicializar tablas
export const initDatabase = async () => {
  try {
    // Tabla principal de checadas pendientes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checadas_pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo_checada INTEGER NOT NULL,
        latitud TEXT NOT NULL,
        longitud TEXT NOT NULL,
        fecha_registro TEXT NOT NULL,
        sincronizado INTEGER DEFAULT 0,
        intentos_reintentos INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de checadas ya sincronizadas (historial local)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checadas_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo_checada INTEGER NOT NULL,
        latitud TEXT NOT NULL,
        longitud TEXT NOT NULL,
        fecha_registro TEXT NOT NULL,
        fecha_sincronizacion TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
};

export const checadasLocalDB = {
  // Guardar una checada pendiente
  guardar: async (
    checada: Omit<ChecadaLocal, "id" | "created_at">,
  ): Promise<number> => {
    try {
      const result = await db.runAsync(
        `INSERT INTO checadas_pendientes 
         (usuario_id, tipo_checada, latitud, longitud, fecha_registro, sincronizado) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          checada.usuario_id,
          checada.tipo_checada,
          checada.latitud,
          checada.longitud,
          checada.fecha_registro,
          checada.sincronizado ? 1 : 0,
        ],
      );
      console.log(
        `Checada guardada localmente con ID: ${result.lastInsertRowId}`,
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error("Error al guardar checada local:", error);
      throw error;
    }
  },

  // Obtener todas las checadas pendientes de sincronizar
  obtenerPendientes: async (): Promise<ChecadaLocal[]> => {
    try {
      const result = await db.getAllAsync<ChecadaLocal>(
        `SELECT * FROM checadas_pendientes WHERE sincronizado = 0 ORDER BY created_at ASC`,
      );
      return result;
    } catch (error) {
      console.error("❌ Error al obtener checadas pendientes:", error);
      return [];
    }
  },

  // Marcar una checada como sincronizada
  marcarSincronizada: async (id: number): Promise<void> => {
    try {
      await db.runAsync(
        `UPDATE checadas_pendientes SET sincronizado = 1 WHERE id = ?`,
        [id],
      );
      console.log(`Checada ${id} marcada como sincronizada`);
    } catch (error) {
      console.error(`Error al marcar checada ${id} como sincronizada:`, error);
      throw error;
    }
  },

  // Mover a historial despues de sincronizar
  moverAHistorial: async (id: number): Promise<void> => {
    try {
      // Obtener el registro
      const checada = await db.getFirstAsync<ChecadaLocal>(
        `SELECT * FROM checadas_pendientes WHERE id = ?`,
        [id],
      );

      if (checada) {
        // Insertar en historial
        await db.runAsync(
          `INSERT INTO checadas_historial 
           (usuario_id, tipo_checada, latitud, longitud, fecha_registro, fecha_sincronizacion) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            checada.usuario_id,
            checada.tipo_checada,
            checada.latitud,
            checada.longitud,
            checada.fecha_registro,
            new Date().toISOString(),
          ],
        );
        // Eliminar de pendientes
        await db.runAsync(`DELETE FROM checadas_pendientes WHERE id = ?`, [id]);
        console.log(`Checada ${id} movida a historial`);
      }
    } catch (error) {
      console.error(`Error al mover checada ${id} a historial:`, error);
      throw error;
    }
  },

  // Obtener historial completo
  obtenerHistorial: async (): Promise<ChecadaLocal[]> => {
    try {
      const result = await db.getAllAsync<ChecadaLocal>(
        `SELECT * FROM checadas_historial ORDER BY created_at DESC LIMIT 100`,
      );
      return result;
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return [];
    }
  },

  // Eliminar checadas antiguas de mas de 30 días
  limpiarHistorialAntiguo: async (): Promise<void> => {
    try {
      await db.runAsync(
        `DELETE FROM checadas_historial 
         WHERE created_at < datetime('now', '-30 days')`,
      );
    } catch (error) {
      console.error("Error al limpiar historial antiguo:", error);
    }
  },

  // Contar checadas pendientes
  contarPendientes: async (): Promise<number> => {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM checadas_pendientes WHERE sincronizado = 0`,
      );
      return result?.count || 0;
    } catch (error) {
      console.error("Error al contar pendientes:", error);
      return 0;
    }
  },

  // Incrementar intentos de reintento
  incrementarIntentos: async (id: number): Promise<void> => {
    try {
      await db.runAsync(
        `UPDATE checadas_pendientes 
         SET intentos_reintentos = intentos_reintentos + 1 
         WHERE id = ?`,
        [id],
      );
    } catch (error) {
      console.error(`Error al incrementar intentos para checada ${id}:`, error);
    }
  },

  // Obtener checadas con muchos intentos fallidos
  obtenerFallidas: async (maxIntentos: number = 5): Promise<ChecadaLocal[]> => {
    try {
      const result = await db.getAllAsync<ChecadaLocal>(
        `SELECT * FROM checadas_pendientes 
         WHERE sincronizado = 0 AND intentos_reintentos >= ?`,
        [maxIntentos],
      );
      return result;
    } catch (error) {
      console.error("Error al obtener checadas fallidas:", error);
      return [];
    }
  },
};

export default db;
