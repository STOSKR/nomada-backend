/**
 * Servicio de Keepalive para mantener el servidor activo
 * Realiza peticiones periódicas al endpoint de health check
 */
const cron = require('node-cron');
const axios = require('axios');

class KeepaliveService {
  constructor() {
    this.isActive = false;
    this.cronJob = null;
    this.serverUrl = this.getServerUrl();
    this.intervalMinutes = 10; // Intervalo de 10 minutos
  }
  /**
   * Obtener la URL del servidor según el entorno
   * @returns {string} URL del servidor
   */  getServerUrl() {
    // En producción, usar RENDER_URL o el dominio del servicio
    if (process.env.NODE_ENV === 'production') {
      if (process.env.RENDER_URL) {
        return process.env.RENDER_URL;
      } else if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
      } else if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        // Construir la URL con el hostname externo y protocolo https
        return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
      }
    }

    // En desarrollo local, usar LOCAL_URL o fallback
    if (process.env.LOCAL_URL) {
      return process.env.LOCAL_URL;
    }

    // Fallback por defecto - usar el puerto configurado en la aplicación
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
  }

  /**
   * Realizar petición de keepalive al endpoint de health
   */
  async ping() {
    try {
      const response = await axios.get(`${this.serverUrl}/health`, {
        timeout: 30000, // 30 segundos de timeout
        headers: {
          'User-Agent': 'Nomada-Keepalive-Service'
        }
      });

      console.log(`[Keepalive] Ping exitoso - Status: ${response.data.status} - ${new Date().toISOString()}`);
      return response.data;
    } catch (error) {
      console.error(`[Keepalive] Error en ping: ${error.message} - ${new Date().toISOString()}`);

      // Si es error de conexión, podría ser que el servidor esté iniciando
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log(`[Keepalive] Servidor posiblemente iniciando en ${this.serverUrl}, reintentando en el próximo ciclo`);
      } else if (error.response) {
        // Error con respuesta del servidor
        console.error(`[Keepalive] Error de respuesta del servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // Error de solicitud sin respuesta
        console.error(`[Keepalive] Error de solicitud sin respuesta a ${this.serverUrl}`);
      }

      throw error;
    }
  }

  /**
   * Iniciar el servicio de keepalive
   */
  start() {
    if (this.isActive) {
      console.log('[Keepalive] El servicio ya está activo');
      return;
    }    // Solo activar en producción o si está explícitamente habilitado
    const shouldRun = process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_KEEPALIVE === 'true';

    if (!shouldRun) {
      console.log('[Keepalive] Servicio deshabilitado en desarrollo');
      return;
    }    // Verificar la configuración disponible para depuración
    console.log('[Keepalive] Configuración del entorno:');
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'no definido'}`);
    console.log(`  - RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'no definido'}`);
    console.log(`  - RENDER_EXTERNAL_HOSTNAME: ${process.env.RENDER_EXTERNAL_HOSTNAME || 'no definido'}`);
    console.log(`  - PORT: ${process.env.PORT || '3000 (por defecto)'}`);

    console.log(`[Keepalive] Iniciando servicio - Ping cada ${this.intervalMinutes} minutos a ${this.serverUrl}`);

    // Configurar cron job para ejecutar cada 10 minutos
    // Formato: segundo minuto hora día mes día-semana
    this.cronJob = cron.schedule(`*/${this.intervalMinutes} * * * *`, async () => {
      try {
        await this.ping();
      } catch (error) {
        // Los errores ya se manejan en el método ping
      }
    }, {
      scheduled: false, // No iniciar automáticamente
      timezone: 'UTC'
    });

    // Iniciar el cron job
    this.cronJob.start();
    this.isActive = true;

    // Realizar el primer ping después de 2 minutos para dar tiempo al servidor
    setTimeout(async () => {
      try {
        console.log('[Keepalive] Realizando primer ping...');
        await this.ping();
      } catch (error) {
        // Error ya manejado en ping()
      }
    }, 2 * 60 * 1000); // 2 minutos

    console.log('[Keepalive] Servicio iniciado correctamente');
  }

  /**
   * Detener el servicio de keepalive
   */
  stop() {
    if (!this.isActive) {
      console.log('[Keepalive] El servicio ya está detenido');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
    }

    this.isActive = false;
    console.log('[Keepalive] Servicio detenido');
  }

  /**
   * Obtener el estado del servicio
   * @returns {Object} Estado del servicio
   */
  getStatus() {
    return {
      isActive: this.isActive,
      serverUrl: this.serverUrl,
      intervalMinutes: this.intervalMinutes,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null
    };
  }
}

// Crear instancia singleton
const keepaliveService = new KeepaliveService();

module.exports = keepaliveService;
