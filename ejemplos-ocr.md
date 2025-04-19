# Guía de Uso: API de OCR para Procesamiento de Imágenes

Esta guía muestra cómo utilizar la API de OCR que hemos implementado para extraer texto de imágenes y optimizar rutas basadas en ese texto.

## 1. Autenticación

Todas las rutas requieren autenticación. Primero, debes obtener un token JWT mediante la ruta de login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com",
    "password": "tu-contraseña"
  }'
```

La respuesta incluirá un token JWT que debes usar en las siguientes peticiones:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

## 2. Procesamiento de Imágenes

### 2.1 Subir una imagen para procesar

```bash
curl -X POST http://localhost:3000/ocr/process-image \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F "image=@ruta/a/tu/imagen.jpg" \
  -F "days=2" \
  -F "maxHoursPerDay=8"
```

### 2.2 Procesar imagen desde URL

```bash
curl -X POST http://localhost:3000/ocr/process-image-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "days": 2,
    "maxHoursPerDay": 8
  }'
```

### 2.3 Procesar imagen en formato base64

```bash
curl -X POST http://localhost:3000/ocr/process-base64 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "base64Image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIA...",
    "days": 2,
    "maxHoursPerDay": 8
  }'
```

## 3. Formato de Respuesta

Todas las rutas devuelven la misma estructura de respuesta:

```json
{
  "success": true,
  "rawText": "Día 1\n1. Museo del Prado\n2. Parque del Retiro\n3. Plaza Mayor\n\nDía 2\n1. Palacio Real\n2. Templo de Debod\n3. Gran Vía",
  "places": [
    {
      "name": "Museo del Prado",
      "day": 1,
      "order_in_day": 0,
      "order_index": 0,
      "coordinates": {
        "lat": 40.4146,
        "lng": -3.6921
      }
    },
    {
      "name": "Parque del Retiro",
      "day": 1,
      "order_in_day": 1,
      "order_index": 1,
      "coordinates": {
        "lat": 40.4153,
        "lng": -3.6844
      }
    },
    // ... más lugares
  ],
  "totalDays": 2
}
```

## 4. Parámetros Opcionales

- `days`: Número de días para distribuir la ruta (predeterminado: 1)
- `maxHoursPerDay`: Horas máximas de actividad por día (predeterminado: 8)

## 5. Ejemplo de Integración en JavaScript

```javascript
// Función para procesar una imagen desde archivo
async function processImageFile(imageFile, days = 1) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('days', days);
  
  const response = await fetch('http://localhost:3000/ocr/process-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}

// Función para procesar una imagen desde URL
async function processImageUrl(imageUrl, days = 1) {
  const response = await fetch('http://localhost:3000/ocr/process-image-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      imageUrl,
      days
    })
  });
  
  return await response.json();
}

// Ejemplo de uso:
document.getElementById('imageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const imageFile = document.getElementById('imageInput').files[0];
  const days = document.getElementById('daysInput').value || 1;
  
  try {
    const result = await processImageFile(imageFile, days);
    
    if (result.success) {
      // Mostrar el texto extraído
      document.getElementById('extractedText').textContent = result.rawText;
      
      // Mostrar los lugares optimizados
      const placesHTML = result.places.map(place => 
        `<li>Día ${place.day}: ${place.order_in_day + 1}. ${place.name}</li>`
      ).join('');
      
      document.getElementById('optimizedPlaces').innerHTML = placesHTML;
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar la imagen');
  }
});
```

## 6. Ejemplo de Formato de Imagen para Mejores Resultados

Para obtener mejores resultados, las imágenes deben tener:

1. Texto claro y legible
2. Buena iluminación
3. Formato estructurado para itinerarios:
   - Indicadores de día ("Día 1", "Día 2", etc.)
   - Numeración de lugares (1, 2, 3...)
   - Un lugar por línea

Ejemplo de formato ideal:

```
Día 1
1. Museo del Prado
2. Parque del Retiro
3. Plaza Mayor

Día 2
1. Palacio Real
2. Templo de Debod
3. Gran Vía
```

## 7. Consideraciones

- El servicio OCR está optimizado para español
- El algoritmo de optimización genera coordenadas simuladas en este momento
- Para usos en producción, se recomienda integrar un servicio de geocodificación para obtener coordenadas reales 