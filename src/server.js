'use strict';

// Cargar variables de entorno
require('dotenv').config();

// Importar dependencias
const fastify = require('fastify')({
  logger: {
    level: 'error',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      }
    }
  }
});

// Importar plugins y componentes propios
const { supabasePlugin, supabase } = require('./db/supabase');

// Verificar que el cliente de Supabase está disponible
console.log('Estado del cliente Supabase:', supabase ? 'Inicializado' : 'No inicializado');

// Configuración básica
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Registrar plugins
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

// Registro de plugins
async function registerPlugins() {
  // Conexión a Supabase
  await fastify.register(supabasePlugin);

  // CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // JWT para autenticación
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'un_secreto_muy_seguro',
    sign: {
      expiresIn: '24h'
    }
  });

  // Decorador para verificar autenticación en rutas protegidas
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ success: false, message: 'No autorizado' });
    }
  });

  // Swagger para documentación
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'API de Nómada',
        description: 'API para la aplicación de viajeros Nómada',
        version: '1.0.0'
      },
      host: HOST === '0.0.0.0' ? `localhost:${PORT}` : `${HOST}:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    },
    exposeRoute: true
  });

  // UI de Swagger
  await fastify.register(swaggerUI, {
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
}

// Registro de rutas
async function registerRoutes() {

  fastify.get('/health', {
    schema: {
      description: 'Verificación de salud del servidor',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  await fastify.register(require('./routes'));
}

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

// Iniciar servidor
async function start() {
  try {
    // Asegurarnos de que primero se registran los plugins
    console.log('Registrando plugins...');
    await registerPlugins();

    // Después registrar las rutas
    console.log('Registrando rutas...');
    await registerRoutes();

    // Iniciar servidor - intentar con puerto inicial
    let currentPort = PORT;
    let maxAttempts = 10;
    let attempts = 0;
    let listening = false;

    while (!listening && attempts < maxAttempts) {
      try {
        await fastify.listen({ port: currentPort, host: HOST });
        listening = true;
      } catch (listenError) {
        if (listenError.code === 'EADDRINUSE') {
          console.log(`Puerto ${currentPort} en uso, intentando con ${currentPort + 1}...`);
          currentPort++;
          attempts++;
        } else {
          throw listenError; // Otro tipo de error, lo propagamos
        }
      }
    }

    if (!listening) {
      throw new Error(`No se pudo encontrar un puerto disponible después de ${maxAttempts} intentos.`);
    }

    console.log(`Servidor escuchando en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${currentPort}`);
    console.log(`Documentación disponible en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${currentPort}/documentacion`);
  } catch (err) {
    fastify.log.error('Error al iniciar el servidor:', err);
    console.error('Detalles del error:', err.message, err.code || '');
    process.exit(1);
  }
}

// Iniciar la aplicación
start();

module.exports = fastify; 