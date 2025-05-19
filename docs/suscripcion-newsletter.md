# Sistema de Suscripción al Newsletter

La API incluye un sistema completo para gestionar suscripciones al newsletter. Este documento explica cómo utilizar esta funcionalidad.

## Configuración

1. Ejecuta el script SQL en `migrations/newsletter_subscribers.sql` para crear la tabla necesaria en tu base de datos Supabase.
2. Asegúrate de que las variables de entorno para el correo electrónico están configuradas en tu archivo `.env`:

```
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
```

## Endpoints disponibles

### 1. Suscribirse al newsletter

**POST** `/newsletter/subscribe`

Permite a un usuario suscribirse proporcionando su correo electrónico.

**Cuerpo de la solicitud**:
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa** (200):
```json
{
  "success": true,
  "message": "Suscripción al newsletter realizada correctamente"
}
```

### 2. Darse de baja del newsletter

**POST** `/newsletter/unsubscribe`

Permite a un usuario cancelar su suscripción.

**Cuerpo de la solicitud**:
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa** (200):
```json
{
  "success": true,
  "message": "Te has dado de baja del newsletter correctamente"
}
```

### 3. Obtener todos los suscriptores (requiere autenticación)

**GET** `/newsletter`

Permite a administradores obtener la lista de todos los suscriptores.

**Parámetros opcionales de consulta**:
- `limit`: Número máximo de resultados (predeterminado: 50)
- `offset`: Desplazamiento para paginación (predeterminado: 0)

**Respuesta exitosa** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "usuario1@ejemplo.com",
      "subscribed_at": "2023-07-25T12:30:00Z",
      "unsubscribed_at": null,
      "is_active": true
    },
    {
      "id": 2,
      "email": "usuario2@ejemplo.com",
      "subscribed_at": "2023-07-26T10:15:00Z",
      "unsubscribed_at": "2023-08-15T18:20:00Z",
      "is_active": false
    }
  ]
}
```

## Funcionamiento

1. Cuando un usuario se suscribe:
   - Se verifica que el correo no exista ya en la base de datos
   - Se guarda el email con fecha de suscripción
   - Se envía un correo de confirmación al usuario

2. Cuando un usuario se da de baja:
   - Se actualiza su estado a inactivo
   - Se registra la fecha de baja

## Integración en el frontend

Para integrar en tu aplicación frontend, añade un formulario simple con un campo de email y un botón de suscripción que envíe una solicitud POST al endpoint `/newsletter/subscribe`.

### Ejemplo básico con HTML y JavaScript:

```html
<form id="newsletter-form">
  <input type="email" id="email" placeholder="Tu correo electrónico" required>
  <button type="submit">Suscribirme</button>
  <div id="message"></div>
</form>

<script>
  document.getElementById('newsletter-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    
    try {
      const response = await fetch('https://tu-api.com/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      document.getElementById('message').textContent = result.message;
      
      if (result.success) {
        document.getElementById('email').value = '';
      }
    } catch (error) {
      document.getElementById('message').textContent = 'Error al procesar la solicitud';
    }
  });
</script>
``` 