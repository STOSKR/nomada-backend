'use strict';

// Cargar variables de entorno
require('dotenv').config();

// Importamos path para manejar rutas absolutas
const path = require('path');

// Función para crear y configurar instancia de Fastify
const createApp = () => {

  const fastify = require('fastify')({
    logger: {
      level: 'info'
    },
    bodyLimit: 100 * 1024 * 1024, // Aumentado a 100MB
    ajv: {
      customOptions: {
        allErrors: true,
        removeAdditional: false,
        useDefaults: true,
        coerceTypes: true
      }
    }
  });

  // Importar plugins y componentes propios con rutas absolutas
  const { supabasePlugin, supabase } = require(path.join(__dirname, 'db/supabase'));

  // Colores para la consola
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  };

  // Registrar plugins de forma sincrónica para entorno serverless
  const registerPlugins = async () => {
    try {

      // Conexión a Supabase
      await fastify.register(supabasePlugin);

      // Configuración explícita para el parser JSON
      fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
        try {
          const json = JSON.parse(body);
          done(null, json);
        } catch (err) {
          err.statusCode = 400;
          err.message = 'Error al parsear JSON: ' + err.message;
          done(err, undefined);
        }
      });

      // Multipart para subida de archivos
      await fastify.register(require('@fastify/multipart'), {
        limits: {
          fieldNameSize: 100, // Tamaño máximo del nombre del campo
          fieldSize: 100 * 1024 * 1024, // Tamaño máximo del campo (100MB)
          fields: 20,          // Número máximo de campos no de archivo
          fileSize: 100 * 1024 * 1024, // Tamaño máximo del archivo (100MB)
          files: 5,            // Número máximo de archivos
          parts: 1000,         // Número máximo de partes (campos + archivos)
          headerPairs: 2000    // Número máximo de pares de cabecera
        },
        // Solo procesar como multipart las rutas que realmente lo necesitan
        addHook: false,
        attachFieldsToBody: true
      });

      // Configuración de CORS para permitir peticiones desde cualquier origen
      await fastify.register(require('@fastify/cors'), {
        origin: true, // Permitir todos los orígenes en desarrollo
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
      });

      // JWT para autenticación
      await fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET || 'un_secreto_muy_seguro',
        sign: {
          expiresIn: '24h'
        }
      });

      // Decorador para verificar autenticación en rutas protegidas
      fastify.decorate('authenticate', async function (request, reply) {
        try {
          const authHeader = request.headers.authorization;

          if (!authHeader) {
            throw new Error('No se proporcionó token de autenticación');
          }

          // Modificación: usar directamente el token sin necesidad de quitar "Bearer "
          let token = authHeader;
          // Si contiene "Bearer ", quitarlo para mantener compatibilidad
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
          }

          try {
            const decoded = await fastify.jwt.verify(token);
            request.user = { id: decoded.id };
          } catch (err) {
            request.log.error(`Error de verificación JWT: ${err.message}`);
            throw new Error('Token de autenticación inválido');
          }
        } catch (err) {
          return reply.code(401).send({
            success: false,
            message: err.message
          });
        }
      });

      // Añadir una ruta de prueba directa para login
      fastify.post('/test-login', async (request, reply) => {
        try {
          const { email, password } = request.body || {};

          if (!email || !password) {
            return reply.code(400).send({
              success: false,
              message: 'Correo electrónico y contraseña son requeridos'
            });
          }

          return {
            success: true,
            message: 'Ruta de prueba funcionando correctamente',
            received: { email }
          };
        } catch (error) {
          return reply.code(500).send({
            success: false,
            message: 'Error interno en ruta de prueba',
            error: error.message
          });
        }
      });

      // Añadir ruta raíz
      fastify.get('/', async (request, reply) => {
        return {
          success: true,
          message: 'API Nómada funcionando correctamente',
          version: '1.0.0',
          serverTime: new Date().toISOString()
        };
      });

      // Middleware para autenticación opcional (permite acceso sin autenticación)
      fastify.decorate('authenticateOptional', async function (request, reply) {
        try {
          const authHeader = request.headers.authorization;

          if (!authHeader) {
            // Continuar sin autenticación
            return;
          }

          // Modificación: usar directamente el token sin necesidad de quitar "Bearer "
          let token = authHeader;
          // Si contiene "Bearer ", quitarlo para mantener compatibilidad
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
          }

          try {
            const decoded = await fastify.jwt.verify(token);
            const user = { id: decoded.id };
            request.user = user;
          } catch (error) {
            // Error en token, pero seguimos sin autenticación
            return;
          }
        } catch (err) {
          // Continuar sin autenticación en caso de cualquier error
        }
      });

      // Swagger para documentación
      await fastify.register(require('@fastify/swagger'), {
        swagger: {
          info: {
            title: 'API de Nómada',
            description: 'API para la aplicación de viajeros Nómada',
            version: '1.0.0'
          },
          host: process.env.HOST === '0.0.0.0' ? `localhost:${process.env.PORT || 3000}` : `${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 3000}`,
          schemes: ['http', 'https'],
          consumes: ['application/json'],
          produces: ['application/json'],
          securityDefinitions: {
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              description: 'Token JWT para autenticación'
            }
          },
          security: [
            {
              apiKey: []
            }
          ]
        },
        hideUntagged: true,
        exposeRoute: true
      });

      // UI de Swagger
      await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/documentacion',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false
        },
        uiHooks: {
          onRequest: function (request, reply, next) { next() },
          preHandler: function (request, reply, next) { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header
      });

      // Registro de rutas de forma dinámica para evitar problemas con las rutas relativas

      // Registrar todas las rutas antes de que el plugin raíz se inicialice
      const routes = [
        {
          module: 'routes/api/test',
          prefix: ''
        },
        {
          module: 'routes/auth.routes',
          prefix: '/auth'
        },
        {
          module: 'routes/user.routes',
          prefix: '/users'
        },
        {
          module: 'routes/route.routes',
          prefix: '/routes'
        },
        {
          module: 'routes/place.routes',
          prefix: '/places'
        },
        {
          module: 'routes/photo.routes',
          prefix: '/photos'
        },
        {
          module: 'routes/recommendation.routes',
          prefix: '/recommendations'
        },
        {
          module: 'routes/ocr.routes',
          prefix: '/ocr'
        }
      ];

      // Registrar todas las rutas en orden
      for (const route of routes) {
        try {
          const routeModule = require(path.join(__dirname, route.module));
          await fastify.register(routeModule, { prefix: route.prefix });
        } catch (error) {
          // Error al cargar ruta
        }
      }

    } catch (err) {
      throw err;
    }
  };

  // Manejador global de errores
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    // Errores personalizados con código de estado
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message
      });
    }

    // Errores de validación de Fastify
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        message: 'Error de validación',
        errors: error.validation
      });
    }

    // Error genérico
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';

    reply.code(statusCode).send({
      success: false,
      message
    });
  });

  // Manejador de proceso para errores no capturados
  process.on('uncaughtException', (error) => {
    // Error no capturado
  });

  process.on('unhandledRejection', (reason, promise) => {
    // Promesa rechazada no manejada
  });

  // Inicializar plugins y rutas
  registerPlugins().catch(err => {
    // Error al registrar plugins
  });

  return fastify;
};

// Inicializar servidor
const startServer = async () => {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';
  const fastify = createApp();

  try {
    await fastify.ready();
    await fastify.listen({ port: PORT, host: HOST });

    const host = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Servidor iniciado en http://${host}:${PORT}`);
    console.log(`Documentación disponible en http://${host}:${PORT}/documentacion`);
  } catch (err) {
    fastify.log.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
};

// Iniciar el servidor independientemente del entorno
// Esto asegura que la aplicación arranque en Render
if (process.env.VERCEL !== '1') {
  startServer();
}

// Para entorno serverless
let cachedApp;

// Exportar para entorno serverless
module.exports = {
  createApp
};

// Exportar para Vercel
module.exports = async (req, res) => {
  try {
    if (!cachedApp) {
      cachedApp = createApp();
      await cachedApp.ready();
    }

    cachedApp.server.emit('request', req, res);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      message: 'Error interno del servidor',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }));
  }
}; 