// Importar fastify y plugins
const fastify = require('fastify');
const cors = require('@fastify/cors');
const { supabasePlugin } = require('./db/supabase'); // Importar el plugin de Supabase

// Implementación para entornos serverless (como Vercel)
const isVercelProd = process.env.VERCEL === '1';

// Setup para multer y manejo de archivos
const path = require('path');
const multer = require('multer');

// Configuración de almacenamiento para diferentes entornos
let storage;
let uploadsDir;

// En entorno Vercel usamos almacenamiento en memoria
if (isVercelProd) {
  // En Vercel, usar almacenamiento en memoria
  storage = multer.memoryStorage();
  uploadsDir = '/tmp'; // directorio temporal, pero no lo usaremos realmente
} else {
  // En desarrollo local, usar almacenamiento en disco
  const fs = require('fs');
  uploadsDir = path.join(__dirname, '../uploads');

  // Asegurar que el directorio de uploads existe
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
}

// Crear instancia de multer
const upload = multer({ storage: storage });

// Utilidad para manejar multer en fastify
const multerHandler = (fieldName) => (request, reply, done) => {
  upload.single(fieldName)(request.raw, reply.raw, (err) => {
    if (err) {
      return done(err);
    }

    // Transferir archivos y campos a request
    if (request.raw.file) {
      request.file = request.raw.file;
    }

    // Asegurarse de que request.body incluye todos los campos
    if (request.raw.body) {
      Object.assign(request.body, request.raw.body);
    }

    done();
  });
};

// Crear la instancia de Fastify con las opciones
const app = fastify({
  logger: true,
  bodyLimit: 100 * 1024 * 1024, // Aumentado a 100MB
  ajv: {
    customOptions: {
      removeAdditional: false,
      coerceTypes: false
    }
  }
});

// Registrar el plugin de Supabase
app.register(supabasePlugin);

// Registrar CORS para permitir solicitudes desde el frontend
app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Configuración para analizar solicitudes JSON de gran tamaño
app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Agregar límite de tamaño específico para solicitudes multipart
app.register(require('@fastify/multipart'), {
  limits: {
    fieldNameSize: 100, // Tamaño máximo del nombre del campo
    fieldSize: 100 * 1024 * 1024, // Tamaño máximo del campo (100MB)
    fields: 10,          // Número máximo de campos no de archivo
    fileSize: 100 * 1024 * 1024, // Tamaño máximo del archivo (100MB)
    files: 1,            // Número máximo de archivos
    headerPairs: 2000    // Número máximo de pares de cabecera
  }
});

// Registrar las rutas principales de la aplicación
const routes = require('./routes');
app.register(routes);

// Ruta raíz para pruebas básicas y disponibilidad del servicio
app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Exportar la aplicación para pruebas y para Vercel
module.exports = async () => {
  await app.ready();
  return app;
};