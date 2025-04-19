'use strict';

// Cargar variables de entorno
require('dotenv').config();

// Importaciones necesarias
const fastify = require('fastify');

// Función para crear la instancia de la app
const createApp = () => {
    const app = fastify({
        logger: {
            level: 'info'
        }
    });

    // Conexión a Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    // CORS simple
    app.register(require('@fastify/cors'), {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });

    // Función para registrar JWT
    app.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET || 'un_secreto_muy_seguro'
    });

    // Autenticación
    app.decorate('authenticate', async (request, reply) => {
        try {
            const token = request.headers.authorization?.replace('Bearer ', '') || '';
            const decoded = await app.jwt.verify(token);
            request.user = { id: decoded.id };
        } catch (err) {
            return reply.code(401).send({ success: false, message: 'Autenticación requerida' });
        }
    });

    // Ruta de salud
    app.get('/api/health', async () => {
        return {
            status: 'success',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };
    });

    // Ruta principal
    app.get('/', async () => {
        return {
            message: 'API Nómada funcionando correctamente',
            version: '1.0.0'
        };
    });

    // Rutas de usuarios - ejemplo simplificado
    app.get('/users/me', { preHandler: [app.authenticate] }, async (request) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', request.user.id)
            .single();

        if (error) throw new Error('Usuario no encontrado');
        return data;
    });

    // Rutas de rutas de viaje - ejemplo simplificado
    app.get('/routes', { preHandler: [app.authenticate] }, async (request) => {
        const { data, error } = await supabase
            .from('routes')
            .select('*')
            .eq('user_id', request.user.id);

        if (error) throw new Error('Error al obtener rutas');
        return data;
    });

    app.get('/routes/all', async () => {
        const { data, error } = await supabase
            .from('routes')
            .select('*')
            .eq('is_public', true)
            .limit(20);

        if (error) throw new Error('Error al obtener rutas públicas');
        return data;
    });

    return app;
};

// Para entornos serverless
let cachedApp;

// Exportar para serverless
module.exports = async (req, res) => {
    try {
        if (!cachedApp) {
            cachedApp = createApp();
            await cachedApp.ready();
        }

        cachedApp.server.emit('request', req, res);
    } catch (err) {
        console.error('Error en el handler serverless:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
}; 