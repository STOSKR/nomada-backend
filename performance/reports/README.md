# Performance Reports

Este directorio contiene los reportes generados por las pruebas de rendimiento.

## Estructura de Archivos

- `*.json` - Datos raw de Artillery
- `*.html` - Reportes visuales generados
- `detailed-log-*.json` - Logs detallados del plugin personalizado

## Archivos Generados Automáticamente

### Por Script de Automatización:
- `basic-YYYYMMDD_HHMMSS.json/html`
- `stress-YYYYMMDD_HHMMSS.json/html`
- `spike-YYYYMMDD_HHMMSS.json/html`
- `api-YYYYMMDD_HHMMSS.json/html`

### Por Ejecución Manual:
Los archivos se nombran según el comando ejecutado.

## Cómo Ver los Reportes

1. **Reportes HTML**: Abre los archivos `.html` en tu navegador
2. **Datos JSON**: Usa `npx artillery report archivo.json` para generar HTML
3. **Dashboard**: Abre `../dashboard.html` para una vista general

## Retención de Archivos

Se recomienda mantener solo los reportes más recientes para evitar acumulación excesiva de archivos.
