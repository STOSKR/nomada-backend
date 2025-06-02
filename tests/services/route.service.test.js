const RouteService = require('../src/services/route.service');

describe('RouteService', () => {
  let routeService;
  let mockSupabase;

  beforeEach(() => {
    // Mock de Supabase
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          range: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }))
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
