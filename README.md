# Nómada Backend API

Backend para la aplicación de viajeros Nómada. Permite a los usuarios gestionar sus perfiles, rutas de viaje y obtener recomendaciones personalizadas.

## Tecnologías utilizadas

- Node.js
- Fastify
- Supabase
- JWT para autenticación
- Swagger para documentación de la API

## Requisitos previos

- Node.js 18 o superior
- Cuenta en Supabase
- NPM o Yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/nomada-backend.git
cd nomada-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Edita el archivo `.env` con tus credenciales de Supabase y demás configuraciones.

## Configuración de Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.io)
2. Crea las siguientes tablas:
   - `users`: Para almacenar perfiles de usuario
   - `routes`: Para almacenar rutas de viaje
   - `places`: Para almacenar destinos y puntos de interés
3. Copia las credenciales (URL y claves) a tu archivo `.env`

### Inicialización de la base de datos

Puedes inicializar la base de datos con datos de ejemplo ejecutando:

```bash
npm run seed
```

Este comando creará:
- Usuarios de prueba
- Lugares populares
- Rutas de ejemplo

## Ejecución

### Modo desarrollo
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

## Documentación de la API

Una vez iniciado el servidor, puedes acceder a la documentación interactiva de la API en:
```
http://localhost:3000/documentacion
```

También puedes consultar la documentación estática en:
- [Documentación completa de rutas](docs/rutas-api.md)
- [Guía de autenticación y manejo de rutas](docs/autenticacion-y-rutas.md)

## Autenticación con JWT

El sistema utiliza JSON Web Tokens (JWT) para la autenticación de usuarios. Para más detalles sobre la implementación y uso, consulta la [guía de autenticación](docs/autenticacion-y-rutas.md).

## Estructura del proyecto

```
src/
  ├── db/             # Configuración de base de datos
  ├── routes/         # Definición de rutas y controladores
  ├── services/       # Lógica de negocio
  ├── utils/          # Utilidades generales
  └── server.js       # Punto de entrada
scripts/
  └── seed-db.js      # Script para inicializar la BD
docs/
  ├── rutas-api.md           # Documentación detallada de la API
  └── autenticacion-y-rutas.md # Guía de autenticación y rutas
```

## Características principales

- Gestión de usuarios: registro, autenticación, preferencias
- Gestión de rutas de viaje: creación, edición, optimización
- Sistema de recomendaciones personalizadas
- Documentación interactiva con Swagger

## Modelo de datos

### Users
- Información de perfil
- Preferencias de viaje
- Países visitados

### Routes
- Información básica de la ruta
- Destinos y orden
- Presupuesto

### Places
- Información del destino
- Coordenadas
- Etiquetas y categorías

## Licencia

ISC