'use strict';

const { createClient } = require('@supabase/supabase-js');
const fp = require('fastify-plugin');

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

async function supabasePlugin(fastify, options) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error && error.code !== '42P01') {
      fastify.log.error('Error al conectar con Supabase:', error.message);
      throw error;
    }

    fastify.log.info('Conexión con Supabase establecida correctamente');
  } catch (err) {
    if (err.code === '42P01') {
      fastify.log.warn('Las tablas no existen en Supabase. Ejecuta: npm run seed');
    } else {
      fastify.log.error('Error al conectar con Supabase:', err.message);
    }
  }

  fastify.decorate('supabase', supabase);

  fastify.decorateRequest('supabase', {
    getter() {
      return supabase;
    }
  });
}

module.exports = {
  supabase,
  supabasePlugin: fp(supabasePlugin)
}; 