'use strict';

/**
 * Script para inicializar la base de datos con datos de ejemplo
 * 
 * Ejecutar con: node scripts/seed-db.js
 */

// Cargar variables de entorno
require('dotenv').config();

// Importar cliente de Supabase
const { supabase } = require('../src/db/supabase');

// Datos de ejemplo para usuarios
const sampleUsers = [
  {
    email: 'shiyicheng13@gmail.com',
    password: 'Password123!',
    username: 'shiyicheng13',
    full_name: 'Shiyi Cheng',
    bio: 'Amante de los viajes y la aventura',
    preferences: {
      favoriteDestinations: ['ES', 'IT', 'FR'],
      travelStyle: 'adventure',
      budget: 'mid-range'
    },
    visited_countries: ['ES', 'FR', 'IT', 'PT']
  },
  {
    email: 'testuser2@gmail.com',
    password: 'Password456!',
    username: 'viajero2',
    full_name: 'Carlos Mochilero',
    bio: 'Viajero de bajo presupuesto en busca de aventuras',
    preferences: {
      favoriteDestinations: ['TH', 'VN', 'KH'],
      travelStyle: 'backpacker',
      budget: 'budget'
    },
    visited_countries: ['TH', 'ID', 'VN']
  }
];

// Datos de ejemplo para lugares
const samplePlaces = [
  {
    name: 'Barcelona',
    country: 'ES',
    description: 'Ciudad cosmopolita con arquitectura única y playas hermosas',
    region: 'Europe',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    tags: ['beach', 'architecture', 'food', 'nightlife'],
    budget_category: 'mid-range',
    best_time_to_visit: 'April to June, September to November',
    image_url: 'https://example.com/barcelona.jpg',
    highlights: [
      'Sagrada Familia',
      'Park Güell',
      'La Rambla',
      'Barrio Gótico',
      'Playa de la Barceloneta'
    ]
  },
  {
    name: 'Tokio',
    country: 'JP',
    description: 'Metrópolis vibrante que combina lo tradicional con lo ultramoderno',
    region: 'Asia',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    tags: ['technology', 'culture', 'food', 'shopping'],
    budget_category: 'luxury',
    best_time_to_visit: 'March to May, September to November',
    image_url: 'https://example.com/tokyo.jpg',
    highlights: [
      'Torre de Tokio',
      'Shibuya Crossing',
      'Templo Senso-ji',
      'Jardines del Palacio Imperial',
      'Akihabara'
    ]
  },
  {
    name: 'Buenos Aires',
    country: 'AR',
    description: 'Ciudad elegante con rica arquitectura y vibrante vida cultural',
    region: 'South America',
    coordinates: { lat: -34.6037, lng: -58.3816 },
    tags: ['culture', 'food', 'architecture', 'nightlife'],
    budget_category: 'budget',
    best_time_to_visit: 'March to May, September to November',
    image_url: 'https://example.com/buenosaires.jpg',
    highlights: [
      'Teatro Colón',
      'Casa Rosada',
      'Recoleta',
      'La Boca',
      'Palermo'
    ]
  }
];

// Datos de ejemplo para rutas
const sampleRoutes = [
  {
    name: 'Tour por Europa',
    description: 'Recorriendo las ciudades más emblemáticas de Europa',
    status: 'planned',
    start_date: '2023-05-01',
    end_date: '2023-05-15',
    destinations: [
      { placeId: '$PLACE_BARCELONA', placeName: 'Barcelona', order: 1, stayDuration: 3 },
      { placeId: '$PLACE_PARIS', placeName: 'París', order: 2, stayDuration: 4 },
      { placeId: '$PLACE_ROME', placeName: 'Roma', order: 3, stayDuration: 3 }
    ],
    budget: {
      transportation: 500,
      accommodation: 700,
      activities: 300,
      food: 400,
      other: 100,
      total: 2000
    }
  }
];

/**
 * Crear las tablas necesarias en la base de datos
 */
async function createTables() {
  console.log('Creando tablas si no existen...');

  try {
    // Crear extensión para UUID si no existe
    const { error: uuidExtError } = await supabase.from('_extensions').select('*').limit(1).maybeSingle();
    if (uuidExtError) {
      console.log('Creando extensión uuid-ossp...');
      // Si hay error probablemente sea porque no tenemos permisos para ver _extensions
      // Intentamos crear la extensión de todas formas
      await supabase.rpc('create_uuid_extension');
    }

    // Crear tabla users utilizando la API de Supabase
    const { error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .catch(() => {
        console.log('Tabla users no existe, creándola...');
        return { error: { message: 'Tabla no existe' } };
      });

    if (usersError) {
      // Si la tabla no existe, la creamos
      await supabase.rpc('execute_sql', {
        sql_query: `
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
        `
      }).catch(error => {
        console.error('Error al crear tabla users:', error.message);
        return false;
      });
      console.log('Tabla users creada.');
    } else {
      console.log('Tabla users ya existe.');
    }

    // Crear tabla places
    const { error: placesError } = await supabase
      .from('places')
      .select('count')
      .limit(1)
      .catch(() => {
        console.log('Tabla places no existe, creándola...');
        return { error: { message: 'Tabla no existe' } };
      });

    if (placesError) {
      // Si la tabla no existe, la creamos
      await supabase.rpc('execute_sql', {
        sql_query: `
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
        `
      }).catch(error => {
        console.error('Error al crear tabla places:', error.message);
        return false;
      });
      console.log('Tabla places creada.');
    } else {
      console.log('Tabla places ya existe.');
    }

    // Crear tabla routes
    const { error: routesError } = await supabase
      .from('routes')
      .select('count')
      .limit(1)
      .catch(() => {
        console.log('Tabla routes no existe, creándola...');
        return { error: { message: 'Tabla no existe' } };
      });

    if (routesError) {
      // Si la tabla no existe, la creamos
      await supabase.rpc('execute_sql', {
        sql_query: `
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
        `
      }).catch(error => {
        console.error('Error al crear tabla routes:', error.message);
        return false;
      });
      console.log('Tabla routes creada.');
    } else {
      console.log('Tabla routes ya existe.');
    }

    console.log('Tablas creadas o verificadas correctamente.');
    return true;
  } catch (error) {
    console.error('Error al crear tablas:', error.message);
    return false;
  }
}

/**
 * Crear usuarios de prueba
 */
async function seedUsers() {
  console.log('Inicializando usuarios...');
  
  for (const user of sampleUsers) {
    try {
      console.log(`Intentando crear usuario: ${user.email}`);
      
      // Verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();
      
      if (checkError && checkError.code !== '42P01') {
        console.error(`Error al verificar si existe el usuario ${user.email}:`, checkError);
      }
      
      if (existingUser) {
        console.log(`Usuario ${user.email} ya existe, omitiendo...`);
        continue;
      }
      
      // Registrar en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username,
            full_name: user.full_name
          }
        }
      });
      
      if (authError) {
        console.error(`Error al crear usuario ${user.email}:`, authError.message);
        continue;
      }
      
      if (!authData || !authData.user) {
        console.error(`No se pudo crear el usuario ${user.email}, respuesta vacía`);
        continue;
      }
      
      console.log(`Usuario Auth creado: ${user.email} (ID: ${authData.user.id})`);
      
      // Esperar un momento para que Auth se actualice
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos a insertar
      const userData = {
        id: authData.user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        bio: user.bio,
        preferences: user.preferences,
        visited_countries: user.visited_countries
      };
      
      console.log('Intentando crear perfil con datos:', JSON.stringify(userData, null, 2));
      
      // Crear perfil en la tabla users
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert(userData);
        
        if (profileError) {
          console.error(`Error al crear perfil para ${user.email}:`, profileError);
          
          if (profileError.code === '42P01') {
            console.error(`La tabla 'users' no existe. Debes crearla manualmente usando el SQL proporcionado.`);
          } else if (profileError.code === '23505') {
            console.error(`El usuario ya existe en la base de datos.`);
          } else {
            console.error(`Detalles del error:`, JSON.stringify(profileError));
          }
          continue;
        }
        
        console.log(`Usuario creado completamente: ${user.email}`);
      } catch (insertError) {
        console.error(`Error durante la inserción para ${user.email}:`, insertError);
        continue;
      }
    } catch (error) {
      console.error(`Error inesperado al crear usuario ${user.email}:`, error);
    }
  }
}

/**
 * Crear lugares de prueba
 */
async function seedPlaces() {
  console.log('Inicializando lugares...');
  
  const placeIds = {};
  
  for (const place of samplePlaces) {
    try {
      console.log(`Intentando crear lugar: ${place.name}`);
      
      // Verificar si el lugar ya existe
      const { data: existingPlace, error: checkError } = await supabase
        .from('places')
        .select('id, name')
        .eq('name', place.name)
        .eq('country', place.country)
        .maybeSingle();
      
      if (existingPlace) {
        console.log(`Lugar ${place.name} ya existe, utilizando ID existente: ${existingPlace.id}`);
        placeIds[place.name] = existingPlace.id;
        continue;
      }
      
      // Crear nuevo lugar
      const { data, error } = await supabase
        .from('places')
        .insert(place)
        .select('id')
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          console.error(`Error al crear lugar ${place.name}: La tabla places no existe`);
        } else {
          console.error(`Error al crear lugar ${place.name}:`, error.message);
        }
        continue;
      }
      
      placeIds[place.name] = data.id;
      console.log(`Lugar creado: ${place.name} (ID: ${data.id})`);
    } catch (error) {
      console.error(`Error inesperado al crear lugar ${place.name}:`, error.message);
    }
  }
  
  return placeIds;
}

/**
 * Crear rutas de prueba
 */
async function seedRoutes(userId, placeIds) {
  console.log('Inicializando rutas...');
  
  for (const route of sampleRoutes) {
    try {
      console.log(`Intentando crear ruta: ${route.name}`);
      
      // Verificar si la ruta ya existe
      if (userId) {
        const { data: existingRoute, error: checkError } = await supabase
          .from('routes')
          .select('id, name')
          .eq('name', route.name)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existingRoute) {
          console.log(`Ruta ${route.name} ya existe para el usuario, omitiendo...`);
          continue;
        }
      }
      
      // Reemplazar placeholders con IDs reales
      const destinations = route.destinations.map(dest => {
        const newDest = { ...dest };
        if (dest.placeId.startsWith('$PLACE_')) {
          const placeName = dest.placeId.replace('$PLACE_', '');
          newDest.placeId = placeIds[placeName] || dest.placeId;
        }
        return newDest;
      });
      
      // Crear nueva ruta
      const { error } = await supabase
        .from('routes')
        .insert({
          user_id: userId,
          name: route.name,
          description: route.description,
          status: route.status,
          start_date: route.start_date,
          end_date: route.end_date,
          destinations: destinations,
          budget: route.budget,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error al crear ruta ${route.name}:`, error.message);
        continue;
      }
      
      console.log(`Ruta creada: ${route.name}`);
    } catch (error) {
      console.error(`Error inesperado al crear ruta ${route.name}:`, error);
    }
  }
}

/**
 * Verificar si el usuario puede crear tablas en Supabase
 */
async function checkCanCreateTables() {
  try {
    console.log('Verificando si tienes permisos para crear tablas en Supabase...');
    
    // Intentar ejecutar una consulta simple
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('---------------------------------------------------');
      console.log('IMPORTANTE: La tabla "users" no existe.');
      console.log('Hay dos maneras de resolver esto:');
      console.log('');
      console.log('1. Crear las tablas manualmente en Supabase:');
      console.log('   - Ve al panel de Supabase: https://app.supabase.com');
      console.log('   - Navega a tu proyecto > SQL Editor');
      console.log('   - Ejecuta el SQL que se mostrará a continuación');
      console.log('');
      console.log('2. Verificar tu configuración de SUPABASE_URL y SUPABASE_KEY:');
      console.log('   - Asegúrate de que estás usando la "service_role key", no la anon key');
      console.log('   - Verifica que la URL sea correcta');
      console.log('---------------------------------------------------');
      
      return false;
    } else if (error) {
      console.log('Error al verificar permisos:', error);
      return false;
    }
    
    console.log('Tienes permisos para acceder a la base de datos.');
    return true;
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
}

/**
 * Función principal para inicializar la BD
 */
async function seedDatabase() {
  try {
    // Verificar conexión
    console.log('Verificando conexión con Supabase...');
    try {
      // Verificamos la conexión de una forma simple que no dependa de tablas existentes
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al conectar con Supabase:', error.message);
        process.exit(1);
      }
      
      console.log('Conexión exitosa con Supabase.');
    } catch (error) {
      console.error('Error al verificar la conexión:', error.message);
      process.exit(1);
    }
    
    // Verificar permisos y estado de las tablas
    await checkCanCreateTables();
    
    // Verificar si las tablas existen
    console.log('Verificando si las tablas existen...');
    let tablesExist = true;
    
    try {
      // Verificar tabla users
      console.log('Verificando tabla users...');
      const usersResult = await supabase.from('users').select('count').limit(1);
      if (usersResult.error) {
        console.log('La tabla users no existe. Debe ser creada manualmente.');
        tablesExist = false;
      } else {
        console.log('Tabla users encontrada.');
      }
      
      // Verificar tabla places
      console.log('Verificando tabla places...');
      const placesResult = await supabase.from('places').select('count').limit(1);
      if (placesResult.error) {
        console.log('La tabla places no existe. Debe ser creada manualmente.');
        tablesExist = false;
      } else {
        console.log('Tabla places encontrada.');
      }
      
      // Verificar tabla routes
      console.log('Verificando tabla routes...');
      const routesResult = await supabase.from('routes').select('count').limit(1);
      if (routesResult.error) {
        console.log('La tabla routes no existe. Debe ser creada manualmente.');
        tablesExist = false;
      } else {
        console.log('Tabla routes encontrada.');
      }
      
      if (!tablesExist) {
        // Imprimir instrucciones SQL en la consola para que el usuario las ejecute manualmente
        console.log('\n------------------------------------------------------------');
        console.log('INSTRUCCIONES PARA CREAR TABLAS MANUALMENTE:');
        console.log('Ejecute estas SQL queries en el SQL Editor de Supabase:');
        console.log('------------------------------------------------------------\n');
        
        const sqlQueries = `
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
);`;

        console.log(sqlQueries);
        
        console.log('\n------------------------------------------------------------');
        console.log('¿Desea continuar con la inserción de datos aunque falten tablas? (s/n)');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise((resolve) => {
          readline.question('> ', (ans) => {
            readline.close();
            resolve(ans.toLowerCase());
          });
        });
        
        if (answer !== 's' && answer !== 'si' && answer !== 'sí' && answer !== 'yes' && answer !== 'y') {
          console.log('Abortando inicialización. Cree las tablas y vuelva a ejecutar el script.');
          process.exit(0);
        }
        
        console.log('Continuando con la inserción de datos...');
      }
    } catch (error) {
      console.error('Error al verificar tablas:', error.message);
      process.exit(1);
    }
    
    console.log('Inicializando base de datos con datos de ejemplo...');
    
    // Crear usuarios
    await seedUsers();
    
    // Obtener ID del primer usuario para asociar rutas
    const { data: firstUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', sampleUsers[0].email)
      .single();
    
    if (userError) {
      console.error('Error al obtener usuario:', userError.message);
    }
    
    // Crear lugares
    const placeIds = await seedPlaces();
    
    // Crear rutas (asociadas al primer usuario)
    if (firstUser) {
      await seedRoutes(firstUser.id, placeIds);
    } else {
      console.log('No se pudo obtener el primer usuario. Las rutas se crearán sin asociar a un usuario.');
      await seedRoutes(null, placeIds);
    }
    
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar inicialización
seedDatabase(); 