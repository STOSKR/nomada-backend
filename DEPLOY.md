# Guía de Despliegue en Render

## Instrucciones para desplegar Nómada Backend en Render

### 1. Preparación del Repositorio

Este repositorio ya está configurado para desplegar en Render con:
- ✅ Node.js 20.19.2 (especificado en `.nvmrc`)
- ✅ Dependencias compatibles (configuradas en `package.json`)
- ✅ Scripts de build optimizados
- ✅ Configuración de Render (`render.yaml`)

### 2. Variables de Entorno Requeridas

Antes de desplegar, configura estas variables de entorno en tu panel de Render:

#### 🔴 REQUERIDAS (el servidor no arrancará sin ellas):
```
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_clave_publica_de_supabase
JWT_SECRET=tu_secreto_jwt_muy_seguro
```

#### 🟡 OPCIONALES (mejoran la funcionalidad):
```
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
CLOUDINARY_NAME=tu_nombre_cloudinary
CLOUDINARY_API_KEY=tu_api_key_cloudinary
CLOUDINARY_API_SECRET=tu_secret_cloudinary
```

#### 🟢 AUTOMÁTICAS (Render las configura):
```
NODE_ENV=production (automática)
PORT=10000 (automática)
HOST=0.0.0.0 (automática)
```

### 3. Pasos para Desplegar

1. **Conectar Repositorio:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Clic en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub

2. **Configuración Automática:**
   - Render detectará automáticamente el `render.yaml`
   - Build Command: `npm install --legacy-peer-deps --force`
   - Start Command: `npm start`

3. **Configurar Variables de Entorno:**
   - En el panel de Render, ve a "Environment"
   - Añade las variables requeridas mencionadas arriba

4. **Verificar Configuración:**
   ```bash
   # Ejecuta localmente para verificar que todo esté bien:
   npm run check-env
   ```

### 4. Solución de Problemas Comunes

#### ❌ Error: "Unsupported engine"
- **Solución:** El proyecto usa configuraciones específicas para compatibilidad. El despliegue debería funcionar automáticamente.

#### ❌ Error: "Missing environment variables"
- **Solución:** Verifica que todas las variables requeridas estén configuradas en Render.

#### ❌ Error: "Port already in use"
- **Solución:** Render maneja los puertos automáticamente. No necesitas configurar PORT manualmente.

#### ❌ Error: "Cannot connect to Supabase"
- **Solución:** Verifica que `SUPABASE_URL` y `SUPABASE_KEY` sean correctas.

### 5. Verificación Post-Despliegue

Una vez desplegado, verifica que todo funcione:

1. **Health Check:** `https://tu-app.onrender.com/health`
2. **API Root:** `https://tu-app.onrender.com/`
3. **Documentación:** `https://tu-app.onrender.com/documentacion`

### 6. Configuración de Base de Datos

Si es tu primera vez desplegando:

1. **Ejecutar Migraciones:**
   ```bash
   # En el dashboard de Render, ve a "Shell" y ejecuta:
   npm run create-tables
   ```

2. **Poblar Datos Iniciales (opcional):**
   ```bash
   npm run seed
   ```

### 7. Monitoreo

- **Logs:** Disponibles en tiempo real en el dashboard de Render
- **Métricas:** CPU, memoria y red en el panel de control
- **Health Check:** Render verifica automáticamente `/health` cada 30 segundos

### 8. Dominio Personalizado (Opcional)

Para usar tu propio dominio:
1. Ve a "Settings" → "Custom Domains"
2. Añade tu dominio
3. Configura los DNS según las instrucciones de Render

---

## Notas Técnicas

- **Node.js:** 20.19.2 (especificado en `.nvmrc`)
- **Build:** Optimizado para producción con `--legacy-peer-deps`
- **Keepalive:** Activado automáticamente en producción
- **CORS:** Configurado para permitir orígenes múltiples
- **Health Check:** Endpoint `/health` configurado

## Soporte

Si tienes problemas durante el despliegue:
1. Verifica los logs en el dashboard de Render
2. Ejecuta `npm run check-env` localmente
3. Revisa que todas las variables de entorno estén configuradas
