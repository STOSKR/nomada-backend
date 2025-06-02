/**
 * Unit tests for PlaceService
 */

const PlaceService = require('../../src/services/place.service');

describe('PlaceService', () => {
    let placeService;
    let mockSupabase;
    let mockQueryBuilder;

    beforeEach(() => {
        // Mock Supabase query builder
        mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            single: jest.fn(),
            // Add other chained methods if used by the service
        };

        // Mock Supabase client
        mockSupabase = {
            from: jest.fn(() => mockQueryBuilder), // from now returns the mockQueryBuilder
            storage: {
                from: jest.fn(() => ({
                    upload: jest.fn(),
                    remove: jest.fn(),
                    getPublicUrl: jest.fn()
                }))
            }
            // rpc: jest.fn() // Add if your service uses RPC calls directly
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
            mockQueryBuilder.single
                .mockResolvedValueOnce({ // place data
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({ // route data for permission check
                    data: mockRoute,
                    error: null
                })
                .mockResolvedValueOnce({ // photos data
                    data: [
                        { id: 'photo-1', url: 'https://example.com/photo1.jpg' },
                        { id: 'photo-2', url: 'https://example.com/photo2.jpg' }
                    ],
                    error: null
                });


            const result = await placeService.getPlaceWithPhotos('place-123', 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(mockQueryBuilder.select).toHaveBeenCalledWith(expect.stringContaining('id,'));
            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'place-123');
            // Further assertions might be needed for the other calls if they are separate "from" chains
            expect(result).toBeDefined();
        });

        it('should throw error if place not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.getPlaceWithPhotos('nonexistent', 'user-123'))
                .rejects.toThrow('Lugar no encontrado');
        });

        it('should throw error if user has no access to private place', async () => {
            mockQueryBuilder.single
                .mockResolvedValueOnce({ // place data
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({ // route data for permission check
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
        };        it('should create place successfully', async () => {
            const mockRoute = { user_id: 'user-123', id: 'route-123' };
            const mockCreatedPlace = { id: 'place-456', name: 'New Place' };

            // Mock route ownership check
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock getting last place for order index (could return null for first place)
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null, // No existing places, so order_index will be 0
                error: null
            });

            // Mock place creation
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockCreatedPlace,
                error: null
            });

            // Setup mocks in the right order
            mockSupabase.from
                .mockReturnValueOnce(mockQueryBuilder) // route check
                .mockReturnValueOnce(mockQueryBuilder) // last place check
                .mockReturnValueOnce(mockQueryBuilder); // place creation

            const result = await placeService.createPlace(newPlaceData, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('routes');
            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            expect(result).toBeDefined();
            expect(result.id).toBe('place-456');
        });

        it('should throw error if user does not own the route', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Route check
                data: { user_id: 'other-user', id: 'route-123' },
                error: null
            });

            await expect(placeService.createPlace(newPlaceData, 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if route not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Route check
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
        };        it('should update place successfully', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };
            const mockRoute = { user_id: 'user-123' };

            // Create separate query builders for each step
            const placeQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockPlace,
                    error: null
                })
            };

            const routeQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockRoute,
                    error: null
                })
            };

            const updateQueryBuilder = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: null
                })
            };

            // Setup mock calls
            mockSupabase.from
                .mockReturnValueOnce(placeQueryBuilder) // place check
                .mockReturnValueOnce(routeQueryBuilder) // route check
                .mockReturnValueOnce(updateQueryBuilder); // update

            await placeService.updatePlace('place-123', updateData, 'user-123');

            expect(updateQueryBuilder.update).toHaveBeenCalledWith(updateData);
            // updatePlace method doesn't return anything, so we just check it doesn't throw
        });

        it('should throw error if place not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Place query
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.updatePlace('nonexistent', updateData, 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if user does not own the route', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };

            mockQueryBuilder.single
                .mockResolvedValueOnce({ // Place query
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({ // Route ownership check
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

            // Mock place query (to get route_id)
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockPlace,
                error: null
            });

            // Mock route ownership check
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Mock place deletion
            mockQueryBuilder.single.mockResolvedValueOnce({ // Assuming delete().eq().single() or similar
                data: null, // Or some confirmation object depending on actual service code
                error: null
            });

            await placeService.deletePlace('place-123', 'user-123');

            expect(mockQueryBuilder.delete).toHaveBeenCalled(); // Called on the 'places' query builder
            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'place-123'); // Chained after delete
        });

        it('should throw error if place not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Place query
                data: null,
                error: { message: 'Place not found' }
            });

            await expect(placeService.deletePlace('nonexistent', 'user-123'))
                .rejects.toThrow();
        });

        it('should throw error if user does not own the route', async () => {
            const mockPlace = { id: 'place-123', route_id: 'route-123' };

            mockQueryBuilder.single
                .mockResolvedValueOnce({ // Place query
                    data: mockPlace,
                    error: null
                })
                .mockResolvedValueOnce({ // Route ownership check
                    data: { user_id: 'other-user' },
                    error: null
                });

            await expect(placeService.deletePlace('place-123', 'user-123'))
                .rejects.toThrow();
        });
    });    describe('updatePlacesOrder', () => {
        const placeOrderUpdates = [
            { id: 'place-1', order_index: 0 },
            { id: 'place-2', order_index: 1 },
            { id: 'place-3', order_index: 2 }
        ];        it('should update places order successfully', async () => {
            const mockRoute = { user_id: 'user-123' };

            // Mock route ownership check
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockRoute,
                error: null
            });

            // Create separate query builders for each update operation
            const createUpdateQueryBuilder = () => ({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis()
            });

            // Mock update operations for each place
            const updateQueryBuilders = placeOrderUpdates.map(() => {
                const builder = createUpdateQueryBuilder();
                // The second eq() call should resolve the promise
                builder.eq.mockReturnValueOnce(builder).mockResolvedValueOnce({ data: null, error: null });
                return builder;
            });

            // Setup from calls
            mockSupabase.from
                .mockReturnValueOnce(mockQueryBuilder) // route check
                .mockReturnValueOnce(updateQueryBuilders[0]) // first place update
                .mockReturnValueOnce(updateQueryBuilders[1]) // second place update
                .mockReturnValueOnce(updateQueryBuilders[2]); // third place update

            await placeService.updatePlacesOrder('route-123', placeOrderUpdates, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('routes');
            expect(mockSupabase.from).toHaveBeenCalledWith('places');
            updateQueryBuilders.forEach((builder, index) => {
                expect(builder.update).toHaveBeenCalledWith({ order_index: placeOrderUpdates[index].order_index });
            });
        });

        it('should throw error if user does not own the route', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Route check
                data: { user_id: 'other-user' },
                error: null
            });

            await expect(placeService.updatePlacesOrder('route-123', placeOrderUpdates, 'user-123'))
                .rejects.toThrow('No tienes permiso para modificar esta ruta');
        });

        it('should throw error if route not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({ // Route check
                data: null,
                error: { message: 'Route not found' }
            });

            await expect(placeService.updatePlacesOrder('nonexistent', placeOrderUpdates, 'user-123'))
                .rejects.toThrow('Ruta no encontrada');
        });
    });    // Remove non-existent methods tests
    // getPlacesByRoute and searchPlacesByName don't exist in PlaceService
    // These functionalities are handled by RouteService.getPlacesFromRoute for getting places
    // and there's no search functionality in PlaceService
});
