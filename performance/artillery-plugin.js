const fs = require('fs');
const path = require('path');

// Plugin personalizado para Artillery
// Permite logging detallado y métricas customizadas

module.exports = {
    Plugin: ArtilleryPlugin
};

function ArtilleryPlugin(script, events) {
    const logFile = path.join(__dirname, 'reports', `detailed-log-${Date.now()}.json`);
    const requests = [];
    const errors = [];

    // Crear directorio de reportes si no existe
    if (!fs.existsSync(path.dirname(logFile))) {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
    }

    // Capturar eventos de request
    events.on('request', (requestParams, context, ee, next) => {
        const startTime = Date.now();

        // Almacenar datos del request
        context.vars.requestStart = startTime;
        context.vars.requestUrl = requestParams.url;
        context.vars.requestMethod = requestParams.method || 'GET';

        return next();
    });

    // Capturar respuestas
    events.on('response', (delta, context, ee, next) => {
        const endTime = Date.now();
        const duration = endTime - context.vars.requestStart;

        const requestData = {
            timestamp: new Date().toISOString(),
            url: context.vars.requestUrl,
            method: context.vars.requestMethod,
            statusCode: delta.statusCode,
            duration: duration,
            scenario: context.scenario?.name || 'unknown'
        };

        requests.push(requestData);

        // Log requests lentos
        if (duration > 1000) {
            console.log(`⚠️  Slow request: ${requestData.method} ${requestData.url} - ${duration}ms`);
        }

        return next();
    });

    // Capturar errores
    events.on('error', (error, context, ee, next) => {
        const errorData = {
            timestamp: new Date().toISOString(),
            error: error.message,
            url: context.vars.requestUrl,
            method: context.vars.requestMethod,
            scenario: context.scenario?.name || 'unknown'
        };

        errors.push(errorData);
        console.log(`❌ Error: ${error.message} on ${errorData.method} ${errorData.url}`);

        return next();
    });

    // Al finalizar las pruebas, guardar logs detallados
    events.on('done', (stats) => {
        const summary = {
            timestamp: new Date().toISOString(),
            totalRequests: requests.length,
            totalErrors: errors.length,
            errorRate: errors.length / requests.length * 100,
            averageResponseTime: requests.reduce((sum, req) => sum + req.duration, 0) / requests.length,
            slowestRequest: requests.reduce((prev, current) =>
                (prev.duration > current.duration) ? prev : current, { duration: 0 }),
            fastestRequest: requests.reduce((prev, current) =>
                (prev.duration < current.duration) ? prev : current, { duration: Infinity }),
            requestsByEndpoint: {},
            errorsByType: {}
        };

        // Agrupar requests por endpoint
        requests.forEach(req => {
            const endpoint = `${req.method} ${req.url}`;
            if (!summary.requestsByEndpoint[endpoint]) {
                summary.requestsByEndpoint[endpoint] = {
                    count: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    maxDuration: 0,
                    minDuration: Infinity
                };
            }

            const endpointData = summary.requestsByEndpoint[endpoint];
            endpointData.count++;
            endpointData.totalDuration += req.duration;
            endpointData.averageDuration = endpointData.totalDuration / endpointData.count;
            endpointData.maxDuration = Math.max(endpointData.maxDuration, req.duration);
            endpointData.minDuration = Math.min(endpointData.minDuration, req.duration);
        });

        // Agrupar errores por tipo
        errors.forEach(error => {
            const errorType = error.error.split(':')[0];
            summary.errorsByType[errorType] = (summary.errorsByType[errorType] || 0) + 1;
        });

        const reportData = {
            summary,
            requests: requests.slice(-100), // Solo los últimos 100 requests para evitar archivos muy grandes
            errors: errors.slice(-50) // Solo los últimos 50 errores
        };

        fs.writeFileSync(logFile, JSON.stringify(reportData, null, 2));
        console.log(`📊 Detailed report saved to: ${logFile}`);

        // Mostrar resumen en consola
        console.log('\n📈 Performance Summary:');
        console.log(`Total Requests: ${summary.totalRequests}`);
        console.log(`Total Errors: ${summary.totalErrors} (${summary.errorRate.toFixed(2)}%)`);
        console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
        console.log(`Slowest Request: ${summary.slowestRequest.duration}ms`);
        console.log(`Fastest Request: ${summary.fastestRequest.duration}ms`);
    });
}
