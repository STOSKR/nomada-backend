# Guía de Autenticación y Rutas de Nómada

## 1. Autenticación con JWT

### ¿Cómo está implementado?

JWT (JSON Web Token) está completamente implementado en nuestra API y funciona de la siguiente manera:

1. **Configuración**: En `src/server.js` registramos el plugin JWT:
   ```javascript
   await fastify.register(jwt, {
     secret: process.env.JWT_SECRET || 'un_secreto_muy_seguro',
     sign: {
       expiresIn: '24h'
     }
   });
   ```

2. **Generación de token**: Cuando un usuario inicia sesión (`/api/users/login`), generamos un token:
   ```javascript
   // En src/routes/user.routes.js
   const token = fastify.jwt.sign({
     id: result.user.id,
     email: result.user.email
   });
   ```

3. **Protección de rutas**: El middleware `authenticate` verifica el token en rutas protegidas:
   ```javascript
   fastify.decorate('authenticate', async (request, reply) => {
     try {
       await request.jwtVerify();
     } catch (err) {
       reply.code(401).send({ success: false, message: 'No autorizado' });
     }
   });
   ```

4. **Uso en rutas protegidas**: Se aplica en todas las rutas que requieren autenticación:
   ```javascript
   fastify.get('/profile', {
     preValidation: [fastify.authenticate]
   }, async (request, reply) => {
     // La ruta solo se ejecuta si el token es válido
     const userId = request.user.id; // request.user contiene los datos del token
   });
   ```

5. **Verificación de token**: Nueva ruta `/api/verify-token` para validar tokens del lado del cliente.

### Flujo de autenticación

1. El usuario se registra en `/api/users/register`
2. El usuario inicia sesión en `/api/users/login` y recibe un token JWT
3. El cliente almacena este token (localStorage, cookies, etc.)
4. Para cada petición a rutas protegidas, el cliente envía el token en la cabecera:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. El servidor verifica el token y permite o deniega el acceso

## 2. Rutas de Itinerarios (Rutas de Viaje)

Todas las rutas de itinerarios están implementadas en `src/routes/route.routes.js`:

### Listado de endpoints

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/routes` | Listar todas las rutas del usuario | Requerida |
| GET | `/api/routes/:id` | Obtener detalles de una ruta específica | Requerida |
| POST | `/api/routes` | Crear una nueva ruta | Requerida |
| PUT | `/api/routes/:id` | Actualizar una ruta existente | Requerida |
| DELETE | `/api/routes/:id` | Eliminar una ruta | Requerida |
| POST | `/api/routes/:id/optimize` | Optimizar orden de destinos | Requerida |

### Ejemplo de uso: Crear una ruta

**Solicitud:**
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
      "placeId": "12345",
      "order": 1,
      "stayDuration": 3
    },
    {
      "placeId": "67890",
      "order": 2,
      "stayDuration": 4
    }
  ]
}
```

**Respuesta:**
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

### Ejemplo de uso: Obtener todas las rutas

**Solicitud:**
```http
GET /api/routes?limit=10&offset=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "route-uuid-1",
      "name": "Vacaciones en Europa",
      "description": "Recorriendo países del sur de Europa",
      "startDate": "2023-08-01",
      "endDate": "2023-08-15",
      "status": "planned",
      "destinations": ["Barcelona", "Roma", "Atenas"],
      "createdAt": "2023-07-15T14:30:00Z"
    },
    {
      "id": "route-uuid-2",
      "name": "Aventura en Asia",
      "description": "Explorando el sudeste asiático",
      "startDate": "2023-10-01",
      "endDate": "2023-10-20",
      "status": "planned",
      "destinations": ["Bangkok", "Singapur", "Bali"],
      "createdAt": "2023-07-10T09:45:00Z"
    }
  ],
  "count": 2
}
```

## 3. Recomendaciones para Implementación en Cliente

1. **Almacenamiento del token**:
   - Guarda el token JWT en localStorage o en una cookie HttpOnly
   - Implementa un interceptor para añadir automáticamente el token a todas las peticiones

2. **Verificación de sesión**:
   - Al iniciar la aplicación, llama a `/api/verify-token` para validar el token
   - Implementa redirección a login si el token es inválido

3. **Manejo de errores 401**:
   - Si recibes un error 401, redirecciona al usuario a la página de login
   - Borra el token almacenado cuando expire o sea inválido

4. **Renovación de token**:
   - Considera implementar renovación automática del token antes de que expire

## 4. Tablas de la Base de Datos

### Tabla 'routes'

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | ID del usuario propietario |
| name | TEXT | Nombre de la ruta |
| description | TEXT | Descripción detallada |
| start_date | DATE | Fecha de inicio |
| end_date | DATE | Fecha de fin |
| status | TEXT | Estado (planned, in-progress, completed) |
| destinations | JSONB | Array de destinos con sus detalles |
| budget | JSONB | Desglose del presupuesto |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última actualización |

Cada destino en el array 'destinations' tiene esta estructura:
```json
{
  "placeId": "place-uuid",
  "placeName": "Barcelona",
  "order": 1,
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
}
``` 