/**
 * Script para crear las tablas necesarias en Supabase
 * 
 * Este script usa la conexión directa a PostgreSQL, evitando
 * las limitaciones de la API de Supabase
 * 
 * Ejecutar: node scripts/create-tables.js
 */

// Cargar variables de entorno
require('dotenv').config();

const { Pool } = require('pg');

// Verificar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY; // Intenta usar una clave de servicio específica si existe

if (!SUPABASE_URL) {
  console.error('Error: No se encontró SUPABASE_URL en el archivo .env');
  process.exit(1);
}

// Extraer datos de conexión de la URL de Supabase
const supabaseUrlData = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!supabaseUrlData) {
  console.error('Error: URL de Supabase inválida');
  process.exit(1);
}

const projectRef = supabaseUrlData[1];
console.log('ID del proyecto Supabase:', projectRef);

// Solicitar información de conexión al usuario
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n====================================================================');
console.log('CONFIGURACIÓN DE CONEXIÓN DIRECTA A POSTGRES EN SUPABASE');
console.log('====================================================================');
console.log('');
console.log('Para crear las tablas necesitamos conectarnos directamente a la base de datos.');
console.log('Puedes encontrar esta información en el panel de Supabase:');
console.log('  1. Ve a https://app.supabase.com y abre tu proyecto');
console.log('  2. Ve a "Project Settings" > "Database"');
console.log('  3. Busca la sección "Connection info" o "Connection string"');
console.log('');

// Función para preguntar información
const question = (text) => new Promise((resolve) => readline.question(text, resolve));

async function getConnectionInfo() {
  console.log('Ingresa la siguiente información (o presiona Enter para usar valores por defecto):');
  
  // Valores predeterminados basados en la configuración estándar de Supabase
  let host = await question('Host [db.jznuazxrtwgicpwflwvi.supabase.co]: ');
  if (!host) host = `db.${projectRef}.supabase.co`;
  
  let port = await question('Puerto [5432]: ');
  if (!port) port = '5432';
  
  let database = await question('Nombre de base de datos [postgres]: ');
  if (!database) database = 'postgres';
  
  let user = await question('Usuario [postgres]: ');
  if (!user) user = 'postgres';
  
  let password = await question('Contraseña (requerida, no se mostrará): ');
  if (!password) {
    console.error('Error: La contraseña es obligatoria');
    return getConnectionInfo();
  }
  
  readline.close();
  
  return {
    host,
    port: parseInt(port),
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  };
}

// Script SQL para crear las tablas
const createTablesSQL = `
-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  visited_countries TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla places
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  region TEXT,
  coordinates JSONB,
  tags TEXT[],
  budget_category TEXT,
  best_time_to_visit TEXT,
  image_url TEXT,
  highlights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla routes
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planned',
  destinations JSONB DEFAULT '[]'::jsonb,
  budget JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users pueden leer su propio perfil" 
  ON public.users 
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users pueden actualizar su propio perfil" 
  ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para places
CREATE POLICY "Places son públicos para lectura" 
  ON public.places 
  FOR SELECT USING (true);
  
-- Políticas para routes
CREATE POLICY "Routes son visibles para su creador" 
  ON public.routes 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Routes pueden ser modificadas por su creador" 
  ON public.routes 
  FOR ALL USING (auth.uid() = user_id);
`;

// Función principal
async function main() {
  try {
    // Obtener información de conexión
    const connectionInfo = await getConnectionInfo();
    
    console.log('\nConectando a la base de datos...');
    const pool = new Pool(connectionInfo);
    
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('Conexión establecida correctamente.');
    
    // Crear tablas
    console.log('\nCreando tablas...');
    await pool.query(createTablesSQL);
    
    console.log('\n¡Tablas creadas correctamente!');
    console.log('\nAhora puedes ejecutar `npm run seed` para inicializar la base de datos con datos de ejemplo.');
    
    // Cerrar la conexión
    await pool.end();
  } catch (error) {
    console.error('Error al crear tablas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
main(); 