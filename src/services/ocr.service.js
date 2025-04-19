const { createWorker } = require('tesseract.js');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const path = require('path');

/**
 * Servicio para procesamiento OCR (Reconocimiento Óptico de Caracteres)
 * y optimización de rutas a partir de texto extraído
 */
class OCRService {
    /**
     * Constructor del servicio OCR
     * @param {Object} supabase - Cliente de Supabase
     */
    constructor(supabase) {
        this.supabase = supabase;

        // Usar el directorio /tmp para entornos serverless (Vercel, AWS Lambda, etc)
        // En desarrollo local, usar un directorio temporal dentro del proyecto
        this.tempDir = process.env.NODE_ENV === 'production'
            ? '/tmp'
            : path.join(__dirname, '../../temp');

        // Crear directorio temporal si no existe y no estamos en producción
        if (process.env.NODE_ENV !== 'production' && !fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        console.log(`OCRService: Usando directorio temporal ${this.tempDir}`);
    }

    /**
     * Procesa una imagen y extrae texto con OCR
     * @param {Buffer|string} imageSource - Buffer de imagen o URL
     * @returns {Promise<Object>} - Texto extraído y datos procesados
     */
    async processImage(imageSource) {
        try {
            // Si la entrada es una URL, descargar primero
            let imagePath;
            let isTemporaryFile = false;

            if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
                // Descargar la imagen desde la URL
                imagePath = await this.downloadImage(imageSource);
                isTemporaryFile = true;
            } else if (Buffer.isBuffer(imageSource)) {
                // Si es un buffer, guardar temporalmente
                const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}.png`);
                await writeFileAsync(tempFilePath, imageSource);
                imagePath = tempFilePath;
                isTemporaryFile = true;
            } else {
                // Asumir que es una ruta de archivo
                imagePath = imageSource;
            }

            // Crear un worker de Tesseract
            const worker = await createWorker('spa');

            // Procesar la imagen con OCR
            const { data } = await worker.recognize(imagePath);

            // Liberar recursos
            await worker.terminate();

            // Eliminar archivo temporal si se creó uno
            if (isTemporaryFile) {
                await unlinkAsync(imagePath).catch(err => console.warn('Error eliminando archivo temporal:', err));
            }

            // Procesar el texto extraído
            const extractedText = data.text;
            const processedData = this.processExtractedText(extractedText);

            return {
                rawText: extractedText,
                processedData
            };
        } catch (error) {
            console.error('Error en procesamiento OCR:', error);
            throw new Error(`Error al procesar imagen con OCR: ${error.message}`);
        }
    }

    /**
     * Descarga una imagen desde una URL
     * @param {string} url - URL de la imagen
     * @returns {Promise<string>} - Ruta del archivo temporal
     */
    async downloadImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error descargando imagen: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const tempFilePath = path.join(this.tempDir, `download_${Date.now()}.png`);
            await writeFileAsync(tempFilePath, buffer);

            return tempFilePath;
        } catch (error) {
            console.error('Error descargando imagen:', error);
            throw error;
        }
    }

    /**
     * Procesa el texto extraído para identificar lugares y días
     * @param {string} text - Texto extraído de la imagen
     * @returns {Object} - Datos procesados
     */
    processExtractedText(text) {
        // Dividir el texto en líneas
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        // Estructura para almacenar los lugares encontrados
        const places = [];

        // Patrones para detectar días
        const dayPattern = /d[ií]a\s*(\d+)/i;
        const simpleNumberPattern = /^\s*(\d+)[.:)]?\s+(.+)/i;

        // Rastrear el día actual mientras procesamos el texto
        let currentDay = 1;

        // Procesar cada línea
        lines.forEach(line => {
            // Verificar si la línea indica un cambio de día
            const dayMatch = line.match(dayPattern);
            if (dayMatch) {
                currentDay = parseInt(dayMatch[1], 10);
                return; // Continuar con la siguiente línea
            }

            // Verificar si es un elemento numerado con un lugar
            const numberMatch = line.match(simpleNumberPattern);
            if (numberMatch) {
                places.push({
                    name: numberMatch[2].trim(),
                    day: currentDay,
                    order_in_day: parseInt(numberMatch[1], 10)
                });
                return;
            }

            // Si no coincide con patrones especiales pero parece un nombre de lugar
            if (line.length > 3 && !line.match(/^\d+$/)) {
                places.push({
                    name: line.trim(),
                    day: currentDay,
                    order_in_day: places.filter(p => p.day === currentDay).length + 1
                });
            }
        });

        // Añadir índice global
        places.forEach((place, index) => {
            place.order_index = index;
        });

        return {
            places,
            totalDays: Math.max(...places.map(p => p.day), 0)
        };
    }

    /**
     * Optimiza el orden de los lugares usando el algoritmo de ruta
     * @param {Array} places - Lugares extraídos
     * @param {Object} options - Opciones (days, startPoint, hotel)
     * @returns {Object} - Ruta optimizada
     */
    async optimizeRoute(places, options = {}) {
        try {
            // Si no hay suficientes lugares para optimizar
            if (!places || places.length < 2) {
                return { places };
            }

            // Preparar lugares con coordenadas
            const placesWithCoordinates = await this.prepareCoordinates(places);

            // Calcular matriz de distancias
            const distances = await this.calculateDistanceMatrix(placesWithCoordinates);

            // Aplicar algoritmo de optimización
            const { days = 1, maxHoursPerDay = 8 } = options;
            const optimizedPlaces = this.findOptimalRoute(
                placesWithCoordinates,
                distances,
                days,
                maxHoursPerDay
            );

            return {
                places: optimizedPlaces,
                totalDays: days
            };
        } catch (error) {
            console.error('Error optimizando ruta:', error);
            throw new Error(`Error al optimizar ruta: ${error.message}`);
        }
    }

    /**
     * Prepara lugares con coordenadas simuladas para la optimización
     * En un entorno real, consultaría a una API de geocodificación
     * @param {Array} places - Lugares extraídos
     * @returns {Array} - Lugares con coordenadas
     */
    async prepareCoordinates(places) {
        // Esta es una función simulada que asigna coordenadas ficticias
        // En un entorno real, se usaría una API de geocodificación

        // Centro de referencia (por ejemplo, centro de la ciudad)
        const baseLatitude = 40.416775;
        const baseLongitude = -3.703790;

        return places.map((place, index) => {
            // Generar coordenadas ligeramente diferentes para cada lugar
            // Esto es solo para simulación
            const lat = baseLatitude + (Math.random() - 0.5) * 0.05;
            const lng = baseLongitude + (Math.random() - 0.5) * 0.05;

            return {
                ...place,
                coordinates: { lat, lng }
            };
        });
    }

    /**
     * Calcula la matriz de distancias entre lugares
     * @param {Array} places - Lugares con coordenadas
     * @returns {Array} - Matriz de distancias
     */
    calculateDistanceMatrix(places) {
        const n = places.length;
        const distances = Array(n).fill().map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                // Calcular distancia usando la fórmula Haversine
                distances[i][j] = this.calculateDistance(
                    places[i].coordinates,
                    places[j].coordinates
                );
            }
        }

        return distances;
    }

    /**
     * Calcula la distancia entre dos puntos geográficos
     * @param {Object} point1 - Primer punto {lat, lng}
     * @param {Object} point2 - Segundo punto {lat, lng}
     * @returns {number} - Distancia en kilómetros
     */
    calculateDistance(point1, point2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(point2.lat - point1.lat);
        const dLon = this.toRad(point2.lng - point1.lng);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     * @param {number} value - Valor en grados
     * @returns {number} - Valor en radianes
     */
    toRad(value) {
        return value * Math.PI / 180;
    }

    /**
     * Encuentra la ruta óptima para los lugares
     * Versión simplificada del algoritmo de optimización
     * @param {Array} places - Lugares con coordenadas
     * @param {Array} distances - Matriz de distancias
     * @param {number} days - Número de días
     * @param {number} maxHoursPerDay - Horas máximas por día
     * @returns {Array} - Lugares con orden optimizado
     */
    findOptimalRoute(places, distances, days = 1, maxHoursPerDay = 8) {
        const n = places.length;

        // Si hay un solo día, ordenar lugares según proximidad
        if (days === 1 || n <= days) {
            // Usar algoritmo del vecino más cercano simplificado
            const visited = Array(n).fill(false);
            const route = [];

            // Empezar desde el primer lugar
            let current = 0;
            visited[current] = true;
            route.push(current);

            // Construir ruta encontrando siempre el vecino más cercano
            while (route.length < n) {
                let bestDist = Infinity;
                let bestNext = -1;

                for (let i = 0; i < n; i++) {
                    if (!visited[i] && distances[current][i] < bestDist) {
                        bestDist = distances[current][i];
                        bestNext = i;
                    }
                }

                if (bestNext !== -1) {
                    visited[bestNext] = true;
                    route.push(bestNext);
                    current = bestNext;
                } else {
                    break;
                }
            }

            // Crear resultado ordenado
            return route.map((idx, i) => ({
                ...places[idx],
                order_index: i,
                day: 1,
                order_in_day: i
            }));
        }

        // Para múltiples días, distribuir lugares por clusters geográficos
        // Extraer coordenadas
        const coordinates = places.map(place => place.coordinates);

        // Calcular el rango en cada eje
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord.lat);
            maxLat = Math.max(maxLat, coord.lat);
            minLng = Math.min(minLng, coord.lng);
            maxLng = Math.max(maxLng, coord.lng);
        });

        // Determinar el eje principal
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;

        // Ordenar lugares según el eje principal
        let sortedPlaces;
        if (lngRange > latRange) {
            // Orientación Este-Oeste
            sortedPlaces = [...places].map((place, idx) => ({
                ...place,
                originalIndex: idx
            })).sort((a, b) => a.coordinates.lng - b.coordinates.lng);
        } else {
            // Orientación Norte-Sur
            sortedPlaces = [...places].map((place, idx) => ({
                ...place,
                originalIndex: idx
            })).sort((a, b) => a.coordinates.lat - b.coordinates.lat);
        }

        // Dividir en clusters para cada día
        const placesPerDay = Math.ceil(n / days);
        const clusters = [];

        for (let i = 0; i < days; i++) {
            const start = i * placesPerDay;
            const end = Math.min(start + placesPerDay, n);

            if (start < n) {
                const cluster = sortedPlaces.slice(start, end).map(p => p.originalIndex);
                clusters.push(cluster);
            }
        }

        // Ordenar cada cluster usando vecino más cercano
        const result = [];

        for (let dayNum = 1; dayNum <= clusters.length; dayNum++) {
            const dayIndices = clusters[dayNum - 1] || [];

            if (dayIndices.length === 0) continue;

            // Aplicar vecino más cercano dentro del día
            const dayPlaces = dayIndices.map(idx => ({
                ...places[idx],
                originalIndex: idx
            }));

            // Ordenar lugares en este día según proximidad
            const dayRoute = this.optimizeDayOrder(dayPlaces, distances);

            // Añadir lugares ordenados al resultado
            for (let j = 0; j < dayRoute.length; j++) {
                const placeObj = dayPlaces[dayRoute[j]];

                result.push({
                    ...places[placeObj.originalIndex],
                    day: dayNum,
                    order_in_day: j,
                    order_index: result.length
                });
            }
        }

        return result;
    }

    /**
     * Optimiza el orden de visita dentro de un día
     * @param {Array} places - Lugares para el día
     * @param {Array} distances - Matriz de distancias
     * @returns {Array} - Índices en orden óptimo
     */
    optimizeDayOrder(places, distances) {
        const n = places.length;

        // Si hay pocos lugares, no es necesario optimizar
        if (n <= 2) {
            return Array.from({ length: n }, (_, i) => i);
        }

        // Usar vecino más cercano para este día
        const visited = Array(n).fill(false);
        const route = [];

        // Empezar con el primer lugar
        let current = 0;
        visited[current] = true;
        route.push(current);

        // Construir ruta
        while (route.length < n) {
            let bestDist = Infinity;
            let bestNext = -1;

            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    // Usar la matriz original de distancias
                    const dist = distances[places[current].originalIndex][places[i].originalIndex];
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestNext = i;
                    }
                }
            }

            if (bestNext !== -1) {
                visited[bestNext] = true;
                route.push(bestNext);
                current = bestNext;
            } else {
                break;
            }
        }

        return route;
    }
}

module.exports = OCRService; 