'use strict';

// Importar la función createApp desde server.js
const { createApp } = require('./server');

// Para entorno serverless
let cachedApp;

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