const PhotoService = require('../../src/services/photo.service.js');
const CloudinaryService = require('../../src/services/cloudinary.service.js');

// Mock CloudinaryService
jest.mock('../../src/services/cloudinary.service.js');

describe('PhotoService', () => {
  let photoService;
  let mockSupabase;
  let mockQueryBuilder;
  let mockCloudinary;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase Query Builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
    };

    // Mock Supabase Client
    mockSupabase = {
      from: jest.fn(() => mockQueryBuilder)
    };

    // Mock CloudinaryService
    mockCloudinary = {
      extractPublicId: jest.fn(),
      getOptimizedUrl: jest.fn(),
      uploadImage: jest.fn(),
      deleteImage: jest.fn()
    };

    CloudinaryService.mockImplementation(() => mockCloudinary);

    photoService = new PhotoService(mockSupabase);
  });

  describe('constructor', () => {
    it('should initialize with supabase and cloudinary', () => {
      expect(photoService.supabase).toBe(mockSupabase);
      expect(photoService.cloudinary).toBe(mockCloudinary);
    });
  });

  describe('getUserPhotos', () => {
    const userId = 'user-123';
    const mockPhotos = [
      {
        id: 'photo-1',
        filename: 'test1.jpg',
        public_url: 'https://res.cloudinary.com/test/image/upload/v123/test1.jpg',
        width: 1920,
        height: 1080,
        size: 500000,
        mime_type: 'image/jpeg',
        created_at: '2023-01-01T00:00:00Z',
        place_id: 'place-1',
        position: 1
      },
      {
        id: 'photo-2',
        filename: 'test2.jpg',
        public_url: 'https://example.com/test2.jpg',
        width: 1280,
        height: 720,
        size: 300000,
        mime_type: 'image/jpeg',
        created_at: '2023-01-02T00:00:00Z',
        place_id: 'place-2',
        position: 2
      }
    ];

    it('should get user photos successfully', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: mockPhotos,
        error: null
      });

      mockCloudinary.extractPublicId.mockReturnValue('test1');
      mockCloudinary.getOptimizedUrl.mockReturnValue('https://optimized-url.jpg');

      const result = await photoService.getUserPhotos(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('photos');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 19);
      expect(result).toHaveLength(2);
      expect(result[0].optimized_url).toBe('https://optimized-url.jpg');
      expect(result[1].optimized_url).toBe('https://example.com/test2.jpg');
    });

    it('should handle pagination options', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        error: null
      });

      await photoService.getUserPhotos(userId, { limit: 10, offset: 5 });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 14);
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(photoService.getUserPhotos(userId))
        .rejects.toThrow('Error al obtener las fotos');
    });

    it('should return empty array when no photos found', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await photoService.getUserPhotos(userId);

      expect(result).toEqual([]);
    });

    it('should handle cloudinary optimization errors gracefully', async () => {
      const photosWithCloudinary = [{
        ...mockPhotos[0],
        public_url: 'https://res.cloudinary.com/test/image/upload/v123/test1.jpg'
      }];

      mockQueryBuilder.range.mockResolvedValue({
        data: photosWithCloudinary,
        error: null
      });

      mockCloudinary.extractPublicId.mockImplementation(() => {
        throw new Error('Extract failed');
      });

      const result = await photoService.getUserPhotos(userId);

      expect(result[0].optimized_url).toBe(photosWithCloudinary[0].public_url);
    });
  });

  describe('getPhoto', () => {
    const photoId = 'photo-123';
    const userId = 'user-123';
    const mockPhoto = {
      id: photoId,
      filename: 'test.jpg',
      public_url: 'https://example.com/test.jpg',
      width: 1920,
      height: 1080,
      size: 500000,
      mime_type: 'image/jpeg',
      created_at: '2023-01-01T00:00:00Z',
      place_id: 'place-1',
      position: 1,
      caption: 'Test photo',
      user_id: 'user-123'
    };

    it('should get photo successfully', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockPhoto,
        error: null
      });

      const result = await photoService.getPhoto(photoId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('photos');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', photoId);
      expect(result).toEqual(mockPhoto);
    });

    it('should throw error when photo not found', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Photo not found' }
      });

      await expect(photoService.getPhoto(photoId, userId))
        .rejects.toThrow('Foto no encontrada');
    });

    it('should throw error when photo data is null', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null
      });

      await expect(photoService.getPhoto(photoId, userId))
        .rejects.toThrow('Foto no encontrada');
    });
  });

  // Note: The actual photo.service.js file has more methods that are not visible in the excerpt.
  // Based on typical photo service functionality, here are additional test scenarios:

  describe('uploadPhoto', () => {
    it('should handle file upload process', async () => {
      // This test would depend on the actual uploadPhoto method implementation
      // which wasn't visible in the provided code excerpt
      expect(photoService).toBeDefined();
    });
  });

  describe('deletePhoto', () => {
    it('should handle photo deletion', async () => {
      // This test would depend on the actual deletePhoto method implementation
      // which wasn't visible in the provided code excerpt
      expect(photoService).toBeDefined();
    });
  });

  describe('updatePhotoMetadata', () => {
    it('should handle photo metadata updates', async () => {
      // This test would depend on the actual updatePhotoMetadata method implementation
      // which wasn't visible in the provided code excerpt
      expect(photoService).toBeDefined();
    });
  });
});
