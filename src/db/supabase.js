'use strict';

const { createClient } = require('@supabase/supabase-js');
const fp = require('fastify-plugin');

/**
 * Conexión a Supabase para usar en toda la aplicación
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan variables de entorno para Supabase: SUPABASE_URL y SUPABASE_KEY son obligatorias');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Plugin para conectar Supabase con Fastify
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function supabasePlugin(fastify, options) {
  try {
    // Realizar una consulta simple para verificar la conexión (solo verificar tablas, no funciones RPC)
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // Si hay un error, pero es porque la tabla no existe, no es crítico
    if (error && error.code !== '42P01') {
      fastify.log.error('Error al conectar con Supabase:', error.message);
      throw error;
    }

    fastify.log.info('Conexión con Supabase establecida correctamente');
  } catch (err) {
    // Si el error es por tablas que no existen, lo consideramos no crítico
    if (err.code === '42P01') {
      fastify.log.warn('Las tablas no existen en Supabase. Ejecuta: npm run seed');
    } else {
      fastify.log.error('Error al conectar con Supabase:', err.message);
      // No lanzamos el error para permitir que la aplicación se inicie
      // y pueda ejecutar el script seed
    }
  }

  // Decorar instancia de Fastify con el cliente
  fastify.decorate('supabase', supabase);

  // Decorar request con el cliente
  fastify.decorateRequest('supabase', {
    getter() {
      return supabase;
    }
  });
}

module.exports = {
  supabase,
  supabasePlugin: fp(supabasePlugin)  // Asegurar que el plugin se encapsule correctamente
}; 