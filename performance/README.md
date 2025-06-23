# Configuración de Artillery para Nomada Backend

Este directorio contiene las configuraciones de pruebas de rendimiento usando Artillery.

## Archivos de Configuración

### 1. `basic-load-test.yml`
- **Propósito**: Prueba básica de carga con patrones de uso normal
- **Usuario**: 5-25 usuarios concurrentes
- **Duración**: ~3.5 minutos
- **Escenarios**: Health checks, autenticación, navegación de contenido

### 2. `stress-test.yml`
- **Propósito**: Prueba de estrés para encontrar límites del sistema
- **Usuarios**: 1-50 usuarios concurrentes (escalado)
- **Duración**: ~8 minutos
- **Escenarios**: Actividad mixta de usuarios, operaciones pesadas, estrés de autenticación

### 3. `spike-test.yml`
- **Propósito**: Simula picos súbitos de tráfico
- **Usuarios**: 100 usuarios concurrentes durante pico
- **Duración**: ~1 minuto
- **Escenarios**: Endpoints críticos durante picos de tráfico

### 4. `endurance-test.yml`
- **Propósito**: Prueba de resistencia de larga duración
- **Usuarios**: 5 usuarios concurrentes constantes
- **Duración**: 30 minutos
- **Escenarios**: Sesiones largas de usuario, verificaciones del sistema

### 5. `api-test.yml`
- **Propósito**: Prueba específica de endpoints de API
- **Usuarios**: 10 usuarios concurrentes
- **Duración**: 1 minuto
- **Escenarios**: Prueba sistemática de todos los endpoints principales

## Cómo Ejecutar las Pruebas

### Requisitos Previos
1. Asegúrate de que el servidor esté ejecutándose en `http://localhost:3000`
2. Instala Artillery: `npm install -g artillery` (o usa la versión local)

### Comandos de Ejecución

```bash
# Prueba básica de carga
npm run perf:basic

# Prueba de estrés
npm run perf:stress

# Prueba de picos de tráfico
npm run perf:spike

# Prueba de resistencia (30 min)
npm run perf:endurance

# Prueba de API específica
npm run perf:api

# Ejecutar todas las pruebas
npm run perf:all
```

### Ejecutar Manualmente

```bash
# Desde el directorio raíz del proyecto
npx artillery run performance/basic-load-test.yml
npx artillery run performance/stress-test.yml --output stress-report.json
npx artillery report stress-report.json
```

## Métricas Importantes

### Métricas de Respuesta
- **p50, p95, p99**: Percentiles de tiempo de respuesta
- **min, max**: Tiempos mínimo y máximo de respuesta
- **median**: Tiempo de respuesta mediano

### Métricas de Rendimiento
- **scenarios.launched**: Escenarios iniciados
- **scenarios.completed**: Escenarios completados
- **requests.completed**: Requests completados
- **requests.failed**: Requests fallidos

### Métricas de Error
- **errors.ECONNREFUSED**: Conexiones rechazadas
- **errors.ETIMEDOUT**: Timeouts
- **errors.ENOTFOUND**: Endpoints no encontrados

## Configuración de Objetivos (SLA)

Las pruebas están configuradas con los siguientes objetivos de rendimiento:

- **p95 < 500ms**: Para carga normal
- **p99 < 1000ms**: Para carga normal
- **Error rate < 5%**: Para carga normal
- **p95 < 1000ms**: Para pruebas de estrés
- **Error rate < 10%**: Para pruebas de estrés

## Interpretación de Resultados

### ✅ Resultados Aceptables
- Todos los percentiles dentro de los límites
- Tasa de error baja
- Sin timeouts o conexiones rechazadas

### ⚠️  Resultados de Advertencia
- p95 o p99 cerca de los límites
- Tasa de error entre 5-15%
- Algunos timeouts ocasionales

### ❌ Resultados Problemáticos
- Percentiles por encima de los límites
- Alta tasa de error (>15%)
- Múltiples timeouts o conexiones rechazadas
- Memoria o CPU del servidor al 100%

## Recomendaciones de Optimización

### Si hay problemas de rendimiento:
1. **Revisar queries de base de datos**: Optimizar consultas lentas
2. **Implementar caché**: Redis para datos frecuentemente accedidos
3. **Conexión pool**: Optimizar conexiones a base de datos
4. **Rate limiting**: Implementar límites de velocidad
5. **CDN**: Para contenido estático
6. **Índices de BD**: Asegurar índices apropiados
7. **Monitoreo**: Implementar logging y métricas en tiempo real

### Escalabilidad:
1. **Load balancer**: Distribuir carga entre múltiples instancias
2. **Horizontal scaling**: Múltiples instancias del servidor
3. **Database scaling**: Read replicas, sharding
4. **Microservicios**: Separar funcionalidades críticas

## Automatización

Para integrar en CI/CD, añade esto a tu pipeline:

```yaml
- name: Performance Tests
  run: |
    npm start &
    sleep 10
    npm run perf:basic
    kill %1
```
