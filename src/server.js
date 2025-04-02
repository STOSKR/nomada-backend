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

// Verificar que el cliente de Supabase está disponible
console.log(`${colors.bright}${colors.magenta}⚡ NÓMADA API${colors.reset} - ${colors.cyan}Iniciando servidor...${colors.reset}`);
console.log(`${colors.yellow}▶ Supabase:${colors.reset} ${supabase ? colors.green + 'Conectado' : colors.red + 'Desconectado'}${colors.reset}`);

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
      // Obtener el token de la cabecera Authorization
      const authHeader = request.headers.authorization;
      console.log('Auth Header:', authHeader);

      if (!authHeader) {
        console.log('No se encontró cabecera de autorización');
        return reply.code(401).send({ success: false, message: 'No autorizado: Falta token' });
      }

      // Si el token tiene el formato "Bearer <token>", extraer solo el token
      let token = authHeader;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      console.log('Token a verificar:', token.substring(0, 15) + '...');

      // Verificar el token
      try {
        const decoded = fastify.jwt.verify(token);
        request.user = decoded;
        console.log('Token verificado para usuario:', decoded.id);
      } catch (err) {
        console.log('Error al verificar token:', err.message);
        return reply.code(401).send({ success: false, message: 'No autorizado: Token inválido' });
      }
    } catch (err) {
      console.log('Error en autenticación:', err.message);
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
    console.log(`\n${colors.yellow}▶ Inicialización:${colors.reset} Cargando plugins...`);
    await registerPlugins();

    // Después registrar las rutas
    console.log(`${colors.yellow}▶ Inicialización:${colors.reset} Configurando rutas...`);
    await registerRoutes();

    // Iniciar servidor - intentar con puerto inicial
    let currentPort = PORT;
    let maxAttempts = 10;
    let attempts = 0;
    let listening = false;

    console.log(`${colors.yellow}▶ Servidor:${colors.reset} Iniciando en puerto ${colors.cyan}${currentPort}${colors.reset}`);

    while (!listening && attempts < maxAttempts) {
      try {
        await fastify.listen({ port: currentPort, host: HOST });
        listening = true;
      } catch (listenError) {
        if (listenError.code === 'EADDRINUSE') {
          console.log(`${colors.yellow}▶ Puerto ${currentPort}:${colors.reset} ${colors.magenta}En uso${colors.reset}, intentando con ${colors.cyan}${currentPort + 1}${colors.reset}...`);
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

    console.log(`\n${colors.bright}${colors.green}✓ Servidor iniciado correctamente${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}📚 Documentación:${colors.reset} http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${currentPort}/documentacion\n`);
  } catch (err) {
    fastify.log.error('Error al iniciar el servidor:', err);
    console.error(`${colors.bright}${colors.red}✗ ERROR:${colors.reset} ${err.message} ${err.code ? `(${err.code})` : ''}`);
    process.exit(1);
  }
}

// Iniciar la aplicación
start();

module.exports = fastify; 