'use strict';

// Importar la función createApp y el handler desde server.js
const { handler } = require('./server');

// Exportar para Vercel
module.exports = handler; 