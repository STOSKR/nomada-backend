const CloudinaryService = require('../../src/services/cloudinary.service.js');
const cloudinary = require('cloudinary').v2;

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn()
    },
    utils: {
      api_sign_request: jest.fn()
    },
    url: jest.fn()
  }
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

describe('CloudinaryService', () => {
  let cloudinaryService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.CLOUDINARY_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    
    cloudinaryService = new CloudinaryService();
  });

  describe('constructor', () => {
    it('should configure cloudinary with environment variables', () => {
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-key',
        api_secret: 'test-secret'
      });
    });
  });

  describe('uploadImage', () => {
    const mockUploadResult = {
      public_id: 'test-id',
      version: 123456,
      format: 'jpg',
      width: 1920,
      height: 1080,
      bytes: 500000,
      url: 'http://res.cloudinary.com/test/image/upload/v123456/test-id.jpg',
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-id.jpg'
    };

    it('should upload file from path successfully', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      cloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      const result = await cloudinaryService.uploadImage('/path/to/file.jpg');

      expect(fs.existsSync).toHaveBeenCalled();
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/path/to/file.jpg', expect.any(Object));
      expect(result).toEqual({
        public_id: 'test-id',
        version: 123456,
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 500000,
        url: 'http://res.cloudinary.com/test/image/upload/v123456/test-id.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-id.jpg'
      });
    });

    it('should upload buffer successfully', async () => {
      const mockBuffer = Buffer.from('test image data');
      
      // Mock upload_stream
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, mockUploadResult);
        return { pipe: jest.fn() };
      });

      const result = await cloudinaryService.uploadImage(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(result).toEqual({
        public_id: 'test-id',
        version: 123456,
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 500000,
        url: 'http://res.cloudinary.com/test/image/upload/v123456/test-id.jpg',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-id.jpg'
      });
    });

    it('should throw error for invalid file input', async () => {
      await expect(cloudinaryService.uploadImage(null))
        .rejects.toThrow('El archivo debe ser un buffer o una ruta válida');
    });

    it('should throw error for non-existent file path', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);

      await expect(cloudinaryService.uploadImage('/non/existent/file.jpg'))
        .rejects.toThrow('El archivo no existe en la ruta');
    });

    it('should handle upload errors', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      cloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(cloudinaryService.uploadImage('/path/to/file.jpg'))
        .rejects.toThrow('Error al subir imagen: Upload failed');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockResult = { result: 'ok' };
      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const result = await cloudinaryService.deleteImage('test-public-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
      expect(result).toEqual(mockResult);
    });

    it('should handle delete errors', async () => {
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Delete failed'));

      await expect(cloudinaryService.deleteImage('test-public-id'))
        .rejects.toThrow('Error al eliminar imagen: Delete failed');
    });
  });

  describe('generateUploadSignature', () => {
    it('should generate upload signature with default options', () => {
      const mockSignature = 'mock-signature';
      cloudinary.utils.api_sign_request.mockReturnValue(mockSignature);

      const result = cloudinaryService.generateUploadSignature();

      expect(cloudinary.utils.api_sign_request).toHaveBeenCalled();
      expect(result).toEqual({
        signature: mockSignature,
        timestamp: expect.any(Number),
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        folder: 'nomada/photos',
        transformation: 'q_auto,f_auto,w_1920,c_limit',
        eager: 'q_auto,f_auto,w_1920,c_limit'
      });
    });

    it('should handle signature generation errors', () => {
      cloudinary.utils.api_sign_request.mockImplementation(() => {
        throw new Error('Signature failed');
      });

      expect(() => cloudinaryService.generateUploadSignature())
        .toThrow('Error al generar firma: Signature failed');
    });
  });

  describe('extractPublicId', () => {
    it('should extract public ID from Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v123456/folder/test-id.jpg';
      const result = cloudinaryService.extractPublicId(url);
      
      expect(result).toBe('folder/test-id');
    });

    it('should throw error for invalid URL', () => {
      expect(() => cloudinaryService.extractPublicId('https://example.com/image.jpg'))
        .toThrow('URL no válida de Cloudinary');
    });

    it('should throw error for malformed Cloudinary URL', () => {
      expect(() => cloudinaryService.extractPublicId('https://res.cloudinary.com/test/invalid'))
        .toThrow('No se pudo extraer el public_id de la URL');
    });
  });

  describe('getOptimizedUrl', () => {
    it('should generate optimized URL with default options', () => {
      const mockUrl = 'https://optimized-url.jpg';
      cloudinary.url.mockReturnValue(mockUrl);

      const result = cloudinaryService.getOptimizedUrl('test-public-id');

      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        fetch_format: 'auto',
        quality: 'auto',
        width: 1200
      });
      expect(result).toBe(mockUrl);
    });

    it('should handle URL generation errors', () => {
      cloudinary.url.mockImplementation(() => {
        throw new Error('URL generation failed');
      });

      expect(() => cloudinaryService.getOptimizedUrl('test-public-id'))
        .toThrow('Error al generar URL optimizada: URL generation failed');
    });
  });

  describe('generateImageVariants', () => {
    it('should generate multiple image variants', () => {
      const mockUrls = {
        thumbnail: 'https://thumbnail.jpg',
        medium: 'https://medium.jpg',
        large: 'https://large.jpg',
        original: 'https://original.jpg'
      };

      cloudinary.url
        .mockReturnValueOnce(mockUrls.thumbnail)
        .mockReturnValueOnce(mockUrls.medium)
        .mockReturnValueOnce(mockUrls.large)
        .mockReturnValueOnce(mockUrls.original);

      const result = cloudinaryService.generateImageVariants('test-public-id');

      expect(cloudinary.url).toHaveBeenCalledTimes(4);
      expect(result).toEqual(mockUrls);
    });

    it('should handle variant generation errors', () => {
      cloudinary.url.mockImplementation(() => {
        throw new Error('Variant generation failed');
      });

      expect(() => cloudinaryService.generateImageVariants('test-public-id'))
        .toThrow('Error al generar variantes: Variant generation failed');
    });
  });
});
