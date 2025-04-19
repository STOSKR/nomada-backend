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

# Nomada Backend - Servicio de Fotos con Cloudinary

## Integración con Cloudinary

El backend incluye una integración con Cloudinary para el almacenamiento y optimización de imágenes.

### Características principales:

- **Optimización automática de imágenes**: todas las imágenes subidas se optimizan automáticamente para mejorar el rendimiento.
- **Múltiples variantes**: se generan automáticamente versiones optimizadas para distintos usos (miniaturas, listados, vista detallada).
- **Gestión integrada**: las imágenes están vinculadas con rutas y lugares en la base de datos.
- **Carga directa**: soporte para carga directa desde el frontend usando firmas seguras.

### Configuración

Las claves de Cloudinary están configuradas en el archivo `.env`:

```
_CLOUDINARY_NAME=your_cloud_name
_CLOUDINARY_API_KEY=your_api_key
_CLOUDINARY_API_SECRET=your_api_secret
_CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### Endpoints disponibles

#### Subida de fotos

- `POST /photos/upload`: Sube una foto directamente al servidor (multipart/form-data)
- `POST /photos/upload-url`: Obtiene una firma para subir directamente a Cloudinary desde el frontend
- `POST /photos/process-upload`: Registra una foto ya subida a Cloudinary

#### Gestión de fotos

- `GET /photos`: Obtiene las fotos del usuario (incluye URLs optimizadas)
- `GET /photos/:id`: Obtiene detalles de una foto específica (incluye variantes)
- `PUT /photos/:id`: Actualiza metadatos de una foto
- `DELETE /photos/:id`: Elimina una foto

### Ejemplo de uso (Frontend)

```javascript
// 1. Obtener datos firmados para subida directa
const response = await api.post('/photos/upload-url', { filename: 'vacaciones.jpg' });
const { uploadData } = response.data.upload;

// 2. Subir a Cloudinary directamente desde el cliente
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('api_key', uploadData.apiKey);
formData.append('timestamp', uploadData.timestamp);
formData.append('signature', uploadData.signature);
formData.append('folder', uploadData.folder);
formData.append('transformation', uploadData.transformation);

const cloudinaryResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${uploadData.cloudName}/image/upload`,
  {
    method: 'POST',
    body: formData
  }
);

const cloudinaryData = await cloudinaryResponse.json();

// 3. Registrar la imagen en la base de datos
await api.post('/photos/process-upload', {
  cloudinaryData: cloudinaryData,
  place_id: 'id_del_lugar', // Opcional
  position: '40.7128,-74.0060' // Opcional
});
```

### Transformaciones disponibles

Todas las imágenes subidas incluyen optimizaciones automáticas:

- **Calidad automática** (`quality: 'auto'`): Cloudinary determina la mejor compresión.
- **Formato automático** (`fetch_format: 'auto'`): entrega WebP a navegadores que lo soportan.
- **Redimensionamiento**: limita el ancho máximo a 1920px manteniendo proporción.

### Más información

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Guía de optimización de imágenes](https://cloudinary.com/documentation/image_optimization)