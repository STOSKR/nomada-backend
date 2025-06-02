/**
 * Unit tests for PlaceService
 */

const PlaceService = require('../../src/services/place.service');

describe('PlaceService', () => {
    let placeService;
    let mockSupabase;

    beforeEach(() => {
        // Mock Supabase client
        mockSupabase = {
            from: jest.fn(() => mockSupabase),
            select: jest.fn(() => mockSupabase),
            eq: jest.fn(() => mockSupabase),
            single: jest.fn(),
            insert: jest.fn(() => mockSupabase),
            update: jest.fn(() => mockSupabase),
            delete: jest.fn(() => mockSupabase),
            order: jest.fn(() => mockSupabase),
            in: jest.fn(() => mockSupabase),
            neq: jest.fn(() => mockSupabase),
            gte: jest.fn(() => mockSupabase),
            storage: {
                from: jest.fn(() => ({
                    upload: jest.fn(),
                    remove: jest.fn(),
                    getPublicUrl: jest.fn()
                }))
            }
        };

        placeService = new PlaceService(mockSupabase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with supabase client', () => {
            const service = new PlaceService(mockSupabase);
            expect(service.supabase).toBe(mockSupabase);
        });
    });

    describe('getPlaceWithPhotos', () => {
        const mockPlace = {
            id: 'place-123',
            name: 'Test Place',
            description: 'A test place',
            coordinates: { lat: 40.7128, lng: -74.0060 },
            address: '123 Test St',
            rating: 4.5,
            schedule: '9:00 AM - 5:00 PM',
            order_in_day: 1,
            day_number: 1,
            order_index: 0,
            route_id: 'route-123',
            created_at: '2024-01-01T00:00:00Z'
        };

        const mockRoute = {
            user_id: 'user-123',
            is_public: true
        };

        it('should get place with photos for authorized user', async () => {
            // Mock place query
            mockSupabase.single.mockResolvedValueOnce({
                data: mockPlace,
                error: null
            });

            // Mock route permissions query
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock photos query
            mockSupabase.single.mockResolvedValueOnce({
                data: [
                    { id: 'photo-1', url: 'https://example.com/photo1.jpg' },
                    { id: 'photo-2', url: 'https://example.com/photo2.jpg' }
                ],
                error: null
            });

            const result = await placeService.getPlaceWithPhotos('place-123', 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id,'));
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'place-123');
            expect(result).toBeDefined();
        });

        it('should throw error if place not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.getPlaceWithPhotos('nonexistent', 'user-123'))
                .rejects.toThrow('Lugar no encontrado');
        });

        it('should throw error if user has no access to private place', async () => {
            mockSupabase.single
                .mockResolvedValueOnce({
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({
                    data: { user_id: 'other-user', is_public: false },
                    error: null
                });

            await expect(placeService.getPlaceWithPhotos('place-123', 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('createPlace', () => {
        const newPlaceData = {
            name: 'New Place',
            description: 'A new test place',
            coordinates: { lat: 40.7128, lng: -74.0060 },
            address: '456 New St',
            rating: 4.0,
            schedule: '10:00 AM - 6:00 PM',
            route_id: 'route-123'
        };

        it('should create place successfully', async () => {
            const mockRoute = { user_id: 'user-123', id: 'route-123' };
            const mockCreatedPlace = { id: 'place-456', ...newPlaceData };

            // Mock route ownership check
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock place creation
            mockSupabase.single.mockResolvedValueOnce({
                data: mockCreatedPlace,
                error: null
            });

            const result = await placeService.createPlace(newPlaceData, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('routes');
            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(mockSupabase.insert).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw error if user does not own the route', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { user_id: 'other-user', id: 'route-123' },
                error: null
            });

            await expect(placeService.createPlace(newPlaceData, 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if route not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Route not found' }
            });

            await expect(placeService.createPlace(newPlaceData, 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('updatePlace', () => {
        const updateData = {
            name: 'Updated Place',
            description: 'Updated description',
            rating: 5.0
        };

        it('should update place successfully', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };
            const mockRoute = { user_id: 'user-123' };
            const mockUpdatedPlace = { ...mockPlace, ...updateData };

            // Mock place query
            mockSupabase.single.mockResolvedValueOnce({
                data: mockPlace,
                error: null
            });

            // Mock route ownership check
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock place update
            mockSupabase.single.mockResolvedValueOnce({
                data: mockUpdatedPlace,
                error: null
            });

            const result = await placeService.updatePlace('place-123', updateData, 'user-123');

            expect(mockSupabase.update).toHaveBeenCalledWith(updateData);
            expect(result).toBeDefined();
        });

        it('should throw error if place not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.updatePlace('nonexistent', updateData, 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if user does not own the route', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };

            mockSupabase.single
                .mockResolvedValueOnce({
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({
                    data: { user_id: 'other-user' },
                    error: null
                });

            await expect(placeService.updatePlace('place-123', updateData, 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('deletePlace', () => {
        it('should delete place successfully', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };
            const mockRoute = { user_id: 'user-123' };

            // Mock place query
            mockSupabase.single.mockResolvedValueOnce({
                data: mockPlace,
                error: null
            });

            // Mock route ownership check
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock place deletion
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await placeService.deletePlace('place-123', 'user-123');

            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'place-123');
        });

        it('should throw error if place not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.deletePlace('nonexistent', 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if user does not own the route', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };

            mockSupabase.single
                .mockResolvedValueOnce({
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({
                    data: { user_id: 'other-user' },
                    error: null
                });

            await expect(placeService.deletePlace('place-123', 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('reorderPlaces', () => {
        const placeOrderUpdates = [
            { id: 'place-1', order_index: 0, day_number: 1 },
            { id: 'place-2', order_index: 1, day_number: 1 },
            { id: 'place-3', order_index: 0, day_number: 2 }
        ];

        it('should reorder places successfully', async () => {
            const mockRoute = { user_id: 'user-123' };

            // Mock route ownership check
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock each update operation
            placeOrderUpdates.forEach(() => {
                mockSupabase.single.mockResolvedValueOnce({
                    data: {},
                    error: null
                });
            });

            await placeService.reorderPlaces('route-123', placeOrderUpdates, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('routes');
            expect(mockSupabase.update).toHaveBeenCalledTimes(placeOrderUpdates.length);
        });

        it('should throw error if user does not own the route', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { user_id: 'other-user' },
                error: null
            });

            await expect(placeService.reorderPlaces('route-123', placeOrderUpdates, 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if route not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Route not found' }
            });

            await expect(placeService.reorderPlaces('nonexistent', placeOrderUpdates, 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('getPlacesByRoute', () => {
        it('should get places by route successfully', async () => {
            const mockPlaces = [
                { id: 'place-1', name: 'Place 1', day_number: 1, order_index: 0 },
                { id: 'place-2', name: 'Place 2', day_number: 1, order_index: 1 },
                { id: 'place-3', name: 'Place 3', day_number: 2, order_index: 0 }
            ];

            const mockRoute = { user_id: 'user-123', is_public: true };

            // Mock route check
            mockSupabase.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock places query
            mockSupabase.single.mockResolvedValueOnce({
                data: mockPlaces,
                error: null
            });

            const result = await placeService.getPlacesByRoute('route-123', 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('routes');
            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(mockSupabase.order).toHaveBeenCalledWith('day_number');
            expect(result).toBeDefined();
        });

        it('should throw error if user has no access to private route', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { user_id: 'other-user', is_public: false },
                error: null
            });

            await expect(placeService.getPlacesByRoute('route-123', 'user-123'))
                .rejects.toThrow();
        });
    });

    describe('searchPlacesByName', () => {
        it('should search places by name successfully', async () => {
            const mockPlaces = [
                { id: 'place-1', name: 'Barcelona Cathedral' },
                { id: 'place-2', name: 'Barcelona Beach' }
            ];

            mockSupabase.single.mockResolvedValue({
                data: mockPlaces,
                error: null
            });

            const result = await placeService.searchPlacesByName('Barcelona');

            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(result).toBeDefined();
        });

        it('should handle empty search results', async () => {
            mockSupabase.single.mockResolvedValue({
                data: [],
                error: null
            });

            const result = await placeService.searchPlacesByName('nonexistent');
            expect(result).toBeDefined();
        });
    });
});
