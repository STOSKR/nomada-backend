# Documentación de la API de Nómada

Este documento proporciona una lista completa de todos los endpoints disponibles en la API de Nómada.

## Base URL

```
http://localhost:3000/api
```

## Autenticación

Todas las rutas marcadas como "Autenticación: Requerida" necesitan un token JWT válido en la cabecera HTTP:

```
Authorization: Bearer {token}
```

El token se obtiene mediante el endpoint de login.

## Endpoints

### Información General

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Información básica de la API | No requerida |
| GET | `/health` | Estado de salud del servidor | No requerida |
| GET | `/verify-token` | Verificar validez del token JWT | Requerida |

### Usuarios

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/users/register` | Registrar nuevo usuario | No requerida |
| POST | `/users/login` | Iniciar sesión | No requerida |
| GET | `/users/profile` | Obtener perfil de usuario | Requerida |
| PUT | `/users/preferences` | Actualizar preferencias | Requerida |
| POST | `/users/visited-countries` | Añadir país visitado | Requerida |

### Rutas de Viaje

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/routes` | Listar rutas del usuario | Requerida |
| GET | `/routes/:id` | Obtener detalles de una ruta | Requerida |
| POST | `/routes` | Crear nueva ruta | Requerida |
| PUT | `/routes/:id` | Actualizar ruta existente | Requerida |
| DELETE | `/routes/:id` | Eliminar ruta | Requerida |
| POST | `/routes/:id/optimize` | Optimizar orden de destinos | Requerida |

### Recomendaciones

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/recommendations` | Obtener recomendaciones personalizadas | Requerida |
| GET | `/recommendations/plan/:placeId` | Obtener plan personalizado para un destino | Requerida |
| GET | `/recommendations/similar/:placeId` | Obtener destinos similares | No requerida |
| POST | `/recommendations/optimal-route` | Generar ruta óptima entre destinos | Requerida |

## Detalles de Endpoints

### Registro de Usuario

```http
POST /api/users/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "username": "usuario1",
  "fullName": "Nombre Completo",
  "bio": "Descripción breve"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "user": {
    "id": "user-uuid",
    "username": "usuario1",
    "email": "usuario@example.com"
  }
}
```

### Inicio de Sesión

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "username": "usuario1",
    "email": "usuario@example.com"
  }
}
```

### Obtener Perfil

```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Respuesta:
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "usuario1",
    "email": "usuario@example.com",
    "fullName": "Nombre Completo",
    "bio": "Descripción breve",
    "preferences": {
      "favoriteDestinations": ["ES", "IT", "FR"],
      "travelStyle": "adventure",
      "budget": "mid-range"
    },
    "visitedCountries": ["ES", "FR", "IT"]
  }
}
```

### Crear Ruta de Viaje

```http
POST /api/routes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Vacaciones en Europa",
  "description": "Recorriendo países del sur de Europa",
  "startDate": "2023-08-01",
  "endDate": "2023-08-15",
  "status": "planned",
  "destinations": [
    {
      "placeId": "place-uuid-1",
      "order": 1,
      "stayDuration": 3
    },
    {
      "placeId": "place-uuid-2",
      "order": 2,
      "stayDuration": 4
    }
  ]
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Ruta creada correctamente",
  "data": {
    "id": "route-uuid",
    "name": "Vacaciones en Europa"
  }
}
```

### Obtener Detalle de Ruta

```http
GET /api/routes/route-uuid
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": "route-uuid",
    "name": "Vacaciones en Europa",
    "description": "Recorriendo países del sur de Europa",
    "startDate": "2023-08-01",
    "endDate": "2023-08-15",
    "status": "planned",
    "destinations": [
      {
        "order": 1,
        "placeId": "place-uuid-1",
        "placeName": "Barcelona",
        "stayDuration": 3,
        "arrivalDate": "2023-08-01",
        "departureDate": "2023-08-04",
        "activities": [
          {
            "id": "activity-uuid",
            "name": "Visita a la Sagrada Familia",
            "description": "Visita guiada",
            "date": "2023-08-02",
            "location": "Sagrada Familia",
            "type": "cultural",
            "isCompleted": false
          }
        ]
      },
      {
        "order": 2,
        "placeId": "place-uuid-2",
        "placeName": "Roma",
        "stayDuration": 4,
        "arrivalDate": "2023-08-05",
        "departureDate": "2023-08-09",
        "activities": []
      }
    ],
    "createdAt": "2023-07-15T10:30:00Z",
    "updatedAt": "2023-07-15T10:30:00Z",
    "totalDistance": 1243.5,
    "budget": {
      "transportation": 500,
      "accommodation": 700,
      "activities": 300,
      "food": 400,
      "other": 100,
      "total": 2000
    }
  }
}
```

### Obtener Recomendaciones Personalizadas

```http
GET /api/recommendations?limit=5&region=Europe&travelStyle=adventure&budget=mid-range
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "placeId": "place-uuid-1",
      "name": "Barcelona",
      "country": "España",
      "description": "Ciudad cosmopolita con arquitectura única y playas hermosas",
      "matchScore": 0.95,
      "imageUrl": "https://example.com/barcelona.jpg",
      "highlights": ["Sagrada Familia", "Park Güell", "La Rambla"],
      "travelTips": ["Visitar temprano por la mañana para evitar multitudes"],
      "bestTimeToVisit": "Abril a Junio, Septiembre a Noviembre",
      "budget": "mid-range",
      "idealFor": ["arquitectura", "playa", "gastronomía"]
    },
    {
      "placeId": "place-uuid-2",
      "name": "Lisboa",
      "country": "Portugal",
      "description": "Capital histórica con encanto y vistas al océano",
      "matchScore": 0.89,
      "imageUrl": "https://example.com/lisbon.jpg",
      "highlights": ["Torre de Belém", "Alfama", "Tranvía 28"],
      "travelTips": ["Comprar la Lisboa Card para transporte y museos"],
      "bestTimeToVisit": "Marzo a Mayo, Septiembre a Octubre",
      "budget": "mid-range",
      "idealFor": ["historia", "vistas", "gastronomía"]
    }
  ]
}
```

### Generar Ruta Óptima

```http
POST /api/recommendations/optimal-route
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "destinations": ["place-uuid-1", "place-uuid-2", "place-uuid-3"],
  "startLocation": "place-uuid-1",
  "optimizationCriteria": "distance"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "route": [
      {
        "order": 1,
        "placeId": "place-uuid-1",
        "placeName": "Barcelona",
        "country": "España",
        "suggestedDays": 3
      },
      {
        "order": 2,
        "placeId": "place-uuid-3",
        "placeName": "Niza",
        "country": "Francia",
        "suggestedDays": 2
      },
      {
        "order": 3,
        "placeId": "place-uuid-2",
        "placeName": "Roma",
        "country": "Italia",
        "suggestedDays": 4
      }
    ],
    "totalDistance": 1432.7,
    "estimatedTravelTime": 14.5,
    "estimatedCost": 850,
    "transportationOptions": [
      {
        "fromPlace": "Barcelona",
        "toPlace": "Niza",
        "options": [
          {
            "type": "tren",
            "duration": "8 horas",
            "cost": "€90-120",
            "frequency": "Diario"
          },
          {
            "type": "avión",
            "duration": "1.5 horas",
            "cost": "€80-150",
            "frequency": "Varias veces por día"
          }
        ]
      },
      {
        "fromPlace": "Niza",
        "toPlace": "Roma",
        "options": [
          {
            "type": "avión",
            "duration": "1.5 horas",
            "cost": "€100-180",
            "frequency": "Diario"
          },
          {
            "type": "tren",
            "duration": "10 horas",
            "cost": "€70-110",
            "frequency": "Diario"
          }
        ]
      }
    ]
  }
}
``` 