const RouteService = require('../../src/services/route.service.js');

describe('RouteService', () => {
  let routeService;
  let mockSupabase;
  let mockQueryBuilder;

  beforeEach(() => {
    // Mock de Supabase Query Builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn(() => Promise.resolve({ data: [], error: null })),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      csv: jest.fn(() => Promise.resolve({ data: '', error: null })),
      explain: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };

    // Mock de Supabase Client
    mockSupabase = {
      from: jest.fn(() => mockQueryBuilder),
      rpc: jest.fn(() => mockQueryBuilder),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
          download: jest.fn(() => Promise.resolve({ data: null, error: null })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://example.com/file.jpg' } })),
          // ... add other storage methods if used
        })),
      },
      auth: {
        // ... mock auth methods if RouteService uses them
      },
    };

    routeService = new RouteService(mockSupabase);
  });
  describe('transformCoordinates', () => {
    it('should transform string coordinates to object', () => {
      const stringCoords = '(40.7128,-74.0060)';
      const result = routeService.transformCoordinates(stringCoords);
      
      expect(result).toEqual({
        lng: 40.7128,  // Nota: PostgreSQL almacena como (lng,lat)
        lat: -74.0060
      });
    });

    it('should return null for invalid coordinates', () => {
      const result = routeService.transformCoordinates('invalid');
      expect(result).toBeNull();
    });

    it('should return coordinates if already an object', () => {
      const coords = { lat: 40.7128, lng: -74.0060 };
      const result = routeService.transformCoordinates(coords);
      expect(result).toEqual(coords);
    });

    it('should return null for null input', () => {
      const result = routeService.transformCoordinates(null);
      expect(result).toBeNull();
    });
  });

  describe('getCountryFromCoordinates', () => {
    it('should return null for invalid coordinates', async () => {
      const result = await routeService.getCountryFromCoordinates(null);
      expect(result).toBeNull();
    });

    it('should return null for coordinates out of range', async () => {
      const result = await routeService.getCountryFromCoordinates({
        lat: 100, // Invalid latitude
        lng: 200  // Invalid longitude
      });
      expect(result).toBeNull();
    });

    it('should validate coordinate types', async () => {
      const result = await routeService.getCountryFromCoordinates({
        lat: 'invalid',
        lng: 'invalid'
      });
      expect(result).toBeNull();
    });
  });

  describe('getRoutes', () => {
    it('should return empty array when no routes found', async () => {
      const result = await routeService.getRoutes();
      expect(result).toEqual([]);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        userId: 'test-user-id',
        featured: true
      };

      await routeService.getRoutes(filters);
      
      // Verificar que se llamó a Supabase con los métodos correctos
      expect(mockSupabase.from).toHaveBeenCalledWith('routes');
    });
  });
});
