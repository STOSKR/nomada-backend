/**
 * Servicio para integración con Cloudinary
 */
const cloudinary = require('cloudinary').v2;

class CloudinaryService {
  /**
   * Constructor
   * Configura la conexión con Cloudinary
   */
  constructor() {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
    });
    this.cloudinary = cloudinary;
  }

  /**
   * Sube una imagen a Cloudinary
   * @param {Buffer|string} file - Archivo de imagen (buffer) o ruta temporal
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} - Resultado de la subida
   */
  async uploadImage(file, options = {}) {
    try {
      console.log('CloudinaryService.uploadImage - Iniciando subida');
      
      // Verificar tipo de entrada
      const isBuffer = Buffer.isBuffer(file);
      const isString = typeof file === 'string';
      
      if (!file || (!isBuffer && !isString)) {
        throw new Error('El archivo debe ser un buffer o una ruta válida');
      }
      
      console.log('Tipo de archivo:', isBuffer ? 'Buffer' : 'Ruta de archivo');
      
      // Si es una ruta, verificar que el archivo existe
      if (isString) {
        const fs = require('fs');
        const path = require('path');
        
        // Convertir a ruta absoluta si es necesario
        const filePath = path.isAbsolute(file) ? file : path.resolve(file);
        
        console.log('Verificando archivo para subir a Cloudinary:', filePath);
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`El archivo no existe en la ruta: ${filePath}`);
        }
        
        console.log('Archivo verificado con éxito, tamaño:', 
          fs.statSync(filePath).size, 'bytes');
      }

      const defaultOptions = {
        folder: 'nomada/photos',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        // Optimizaciones para evitar imágenes demasiado pesadas
        quality: 'auto', // Calidad automática
        fetch_format: 'auto', // Formato óptimo según navegador
        transformation: [
          { width: 1920, crop: 'limit' } // Limitar ancho máximo manteniendo proporción
        ]
      };
      
      console.log('CloudinaryService - Opciones de subida:', {
        ...defaultOptions,
        ...options,
      });
      
      const uploadOptions = { ...defaultOptions, ...options };
      
      // Usar stream_upload si es un buffer para mayor eficiencia
      let result;
      if (isBuffer) {
        console.log('Subiendo como stream desde buffer');
        result = await new Promise((resolve, reject) => {
          const stream = require('stream');
          const bufferStream = new stream.PassThrough();
          bufferStream.end(file);
          
          const uploadStream = this.cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('Error en upload_stream:', error);
                return reject(error);
              }
              resolve(result);
            }
          );
          
          bufferStream.pipe(uploadStream);
        });
      } else {
        // Subida normal para ruta de archivo
        console.log('Subiendo desde ruta de archivo');
        result = await this.cloudinary.uploader.upload(file, uploadOptions);
      }
      
      console.log('CloudinaryService - Imagen subida exitosamente:', {
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
      
      return {
        public_id: result.public_id,
        version: result.version,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.url,
        secure_url: result.secure_url
      };
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param {string} publicId - ID público de la imagen en Cloudinary
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async deleteImage(publicId) {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error al eliminar imagen de Cloudinary:', error);
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }
  }

  /**
   * Genera una URL firmada para subir imágenes directamente a Cloudinary
   * @param {Object} options - Opciones para la firma
   * @returns {Object} - Datos de la URL firmada
   */
  generateUploadSignature(options = {}) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const defaultOptions = {
        folder: 'nomada/photos',
        timestamp,
        // Agregar parámetros de optimización
        transformation: 'q_auto,f_auto,w_1920,c_limit',
        eager: 'q_auto,f_auto,w_1920,c_limit'
      };
      
      const params = { ...defaultOptions, ...options };
      const signature = this.cloudinary.utils.api_sign_request(params, process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET);
      
      return {
        signature,
        timestamp,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_NAME,
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        folder: params.folder,
        transformation: params.transformation,
        eager: params.eager
      };
    } catch (error) {
      console.error('Error al generar firma para Cloudinary:', error);
      throw new Error(`Error al generar firma: ${error.message}`);
    }
  }

  /**
   * Extrae el publicId de una URL de Cloudinary
   * @param {string} url - URL de la imagen en Cloudinary
   * @returns {string} - ID público de la imagen
   */
  extractPublicId(url) {
    try {
      // Asegurarse de que es una URL de Cloudinary
      if (!url || !url.includes('cloudinary.com')) {
        throw new Error('URL no válida de Cloudinary');
      }
      
      // Extraer el public_id
      const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
      const match = url.match(regex);
      
      if (match && match[1]) {
        return match[1];
      }
      
      throw new Error('No se pudo extraer el public_id de la URL');
    } catch (error) {
      console.error('Error al extraer public_id:', error);
      throw error;
    }
  }

  /**
   * Genera una URL optimizada para una imagen
   * @param {string} publicId - ID público de la imagen
   * @param {Object} options - Opciones de transformación
   * @returns {string} - URL optimizada
   */
  getOptimizedUrl(publicId, options = {}) {
    try {
      const defaultOptions = {
        fetch_format: 'auto',
        quality: 'auto',
        width: 1200
      };

      const transformOptions = { ...defaultOptions, ...options };
      return this.cloudinary.url(publicId, transformOptions);
    } catch (error) {
      console.error('Error al generar URL optimizada:', error);
      throw new Error(`Error al generar URL optimizada: ${error.message}`);
    }
  }

  /**
   * Genera múltiples versiones de una imagen para diferentes usos
   * @param {string} publicId - ID público de la imagen
   * @returns {Object} - URLs de las diferentes versiones
   */
  generateImageVariants(publicId) {
    try {
      return {
        // Versión para vista previa (thumbnail)
        thumbnail: this.cloudinary.url(publicId, {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'auto',
          fetch_format: 'auto',
          quality: 'auto'
        }),
        
        // Versión para listados
        medium: this.cloudinary.url(publicId, {
          width: 600,
          crop: 'scale',
          fetch_format: 'auto',
          quality: 'auto'
        }),
        
        // Versión para vista detallada
        large: this.cloudinary.url(publicId, {
          width: 1200,
          crop: 'limit',
          fetch_format: 'auto',
          quality: 'auto'
        }),
        
        // URL original con optimizaciones básicas
        original: this.cloudinary.url(publicId, {
          fetch_format: 'auto',
          quality: 'auto'
        })
      };
    } catch (error) {
      console.error('Error al generar variantes de imagen:', error);
      throw new Error(`Error al generar variantes: ${error.message}`);
    }
  }
}

module.exports = CloudinaryService; 