'use strict';

const { createClient } = require('@supabase/supabase-js');
const fp = require('fastify-plugin');

/**
 * Conexión a Supabase
 * 
 * Este módulo configura y exporta el cliente de Supabase para usar en toda la aplicación
 */

// Verificar las variables de entorno necesarias
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan variables de entorno para Supabase: SUPABASE_URL y SUPABASE_KEY son obligatorias');
}

// Crear el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false
  }
});

/**
 * Plugin para conectar Supabase con Fastify
 * @param {Object} fastify - Instancia de Fastify
 * @param {Object} options - Opciones del plugin
 */
async function supabasePlugin(fastify, options) {
  // Verificar la conexión
  try {
    // Intentamos una consulta simple que no dependa de tablas específicas
    const { data, error } = await supabase.rpc('get_service_role');
    
    if (error && error.code !== '42P01') { // Ignoramos el error si es porque la función o tabla no existe
      fastify.log.error('Error al conectar con Supabase:', error.message);
      throw error;
    }
    
    fastify.log.info('Conexión con Supabase establecida correctamente');
    fastify.log.warn('Nota: Es posible que necesites crear las tablas. Ejecuta: npm run seed');
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

  // Decorar Fastify con el cliente de Supabase
  fastify.decorate('supabase', supabase);
  
  // Decorar la petición con el cliente de Supabase para acceso en las rutas
  fastify.decorateRequest('supabase', {
    getter() {
      return supabase;
    }
  });
}

module.exports = {
  supabase,
  supabasePlugin
}; 