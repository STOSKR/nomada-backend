'use strict';

// Cargar variables de entorno
require('dotenv').config();

// Configuración básica 
const fastify = require('fastify')({
    logger: {
        level: 'info'
    }
});

// Registrar CORS
fastify.register(require('@fastify/cors'), {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Ruta de prueba
fastify.get('/api/test', async (request, reply) => {
    return {
        status: 'success',
        message: '¡API Nómada funcionando correctamente!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    };
});

// Ruta raíz
fastify.get('/', async (request, reply) => {
    return {
        status: 'online',
        message: 'API Nómada v1.0',
        docs: '/documentacion'
    };
});

// Exportar para serverless
module.exports = async (req, res) => {
    await fastify.ready();
    fastify.server.emit('request', req, res);
}; 