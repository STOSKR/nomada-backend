'use strict';

// Cargar variables de entorno
require('dotenv').config();

// Importamos path para manejar rutas absolutas
const path = require('path');

// Función para crear y configurar instancia de Fastify
const createApp = () => {
  console.log('Iniciando creación de aplicación...');
  console.log('Directorio actual:', __dirname);

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
  console.log('Supabase plugin cargado correctamente');

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
      console.log('Iniciando registro de plugins...');

      // Conexión a Supabase
      await fastify.register(supabasePlugin);
      console.log('Plugin de Supabase registrado correctamente');

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
      console.log('Parser JSON configurado correctamente');

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
      console.log('Plugin multipart registrado correctamente');

      // JWT para autenticación
      await fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET || 'un_secreto_muy_seguro',
        sign: {
          expiresIn: '24h'
        }
      });
      console.log('Plugin JWT registrado correctamente');

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
        console.log('Recibida petición a /test-login');
        console.log('Headers:', request.headers);
        console.log('Body:', request.body);

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
          console.error('Error en test-login:', error);
          return reply.code(500).send({
            success: false,
            message: 'Error interno en ruta de prueba',
            error: error.message
          });
        }
      });

      // Añadir ruta raíz
      fastify.get('/', async (request, reply) => {
        console.log('Recibida petición a la ruta raíz (/)');
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
      console.log('Decoradores de autenticación registrados correctamente');

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
      console.log('Plugin Swagger registrado correctamente');

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
      console.log('Plugin Swagger UI registrado correctamente');

      // Registro de rutas de forma dinámica para evitar problemas con las rutas relativas
      console.log('Registrando rutas...');

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
          console.log(`Rutas de ${route.module} registradas correctamente`);
        } catch (error) {
          console.error(`Error al cargar rutas de ${route.module}:`, error);
        }
      }

      console.log('Todas las rutas registradas correctamente');

    } catch (err) {
      console.error('Error al registrar plugins:', err);
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
    console.error('Error no capturado:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
  });

  // Inicializar plugins y rutas
  registerPlugins().catch(err => {
    console.error('Error al registrar plugins:', err);
  });

  return fastify;
};

// Iniciar servidor si no estamos en entorno de producción
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';
  const fastify = createApp();

  fastify.listen({ port: PORT, host: HOST }, (err) => {
    if (err) {
      console.error('Error al iniciar el servidor:', err);
      fastify.log.error('Error al iniciar el servidor:', err);
      process.exit(1);
    }
    console.log(`Servidor iniciado en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

// Para entorno serverless
let cachedApp;

// Exportar para Vercel
module.exports = async (req, res) => {
  try {
    if (!cachedApp) {
      console.log('Inicializando instancia de Fastify para entorno serverless');
      cachedApp = createApp();
      await cachedApp.ready();
      console.log('Instancia de Fastify inicializada para entorno serverless');
    }

    cachedApp.server.emit('request', req, res);
  } catch (err) {
    console.error('Error en handler serverless:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      message: 'Error interno del servidor',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }));
  }
}; 