'use strict';

// Importar la función createApp y el handler desde server.js
const { createApp, handler } = require('./server');
const consoleUtils = require('./utils/console');

// Verificar si la aplicación está correctamente configurada
const checkApp = async () => {
    try {
        const app = createApp();
        await app.ready();
        consoleUtils.info('APLICACIÓN INICIALIZADA CORRECTAMENTE EN VERCEL');

        // Registrar todas las rutas disponibles
        const routes = app.printRoutes();
        consoleUtils.info('RUTAS REGISTRADAS:');
        routes.forEach(route => {
            const methodColor = getMethodColor(route.method);
            console.log(`${methodColor}${route.method.padEnd(7)}${consoleUtils.colors.reset} ${route.url}`);
        });

        return true;
    } catch (error) {
        consoleUtils.error('ERROR AL INICIALIZAR LA APLICACIÓN', error);
        return false;
    }
};

// Ejecutar verificación al inicio
checkApp();

// Exportar para Vercel
module.exports = handler;

// Función para obtener el color según el método HTTP
function getMethodColor(method) {
    const colors = {
        'GET': consoleUtils.colors.green,
        'POST': consoleUtils.colors.cyan,
        'PUT': consoleUtils.colors.yellow,
        'PATCH': consoleUtils.colors.magenta,
        'DELETE': consoleUtils.colors.red,
        'OPTIONS': consoleUtils.colors.blue,
        'HEAD': consoleUtils.colors.dim
    };
    return colors[method] || consoleUtils.colors.white;
} 