'use strict';

// Importar la función createApp y el handler desde server.js
const { createApp, handler } = require('./server');

// Verificar si la aplicación está correctamente configurada
const checkApp = async () => {
    try {
        const app = createApp();
        await app.ready();
        console.log('Aplicación inicializada correctamente en Vercel');

        // Registrar todas las rutas disponibles
        const routes = app.routes;
        console.log('Rutas registradas:');
        routes.forEach(route => {
            console.log(`${route.method} ${route.url}`);
        });

        return true;
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        return false;
    }
};

// Ejecutar verificación al inicio
checkApp();

// Exportar para Vercel
module.exports = handler; 