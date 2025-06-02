/**
 * Unit tests for UserService
 */

const UserService = require('../../src/services/user.service');

describe('UserService', () => {
    let userService;
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
            ilike: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn(),
            maybeSingle: jest.fn(),
            count: jest.fn().mockReturnThis()
        };

        // Mock Supabase client
        mockSupabase = {
            from: jest.fn(() => mockQueryBuilder),
        };

        userService = new UserService(mockSupabase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should throw error if supabase client is not provided', () => {
            expect(() => new UserService(null)).toThrow('Cliente de Supabase no disponible');
        });

        it('should initialize with supabase client', () => {
            const service = new UserService(mockSupabase);
            expect(service.supabase).toBe(mockSupabase);
        });
    });

    describe('getUserProfile', () => {
        const mockUser = {
            id: 'user-123',
            nomada_id: 'nomada123',
            username: 'testuser',
            email: 'test@example.com',
            bio: 'Test bio',
            avatar_url: 'https://example.com/avatar.jpg',
            preferences: { theme: 'dark' },
            visited_countries: ['ES', 'FR'],
            followers_count: 10,
            following_count: 5
        };

        it('should get user profile successfully', async () => {
            // Mock user profile data
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            // Mock routes count query
            mockQueryBuilder.count.mockResolvedValueOnce({
                count: 3,
                error: null
            });

            // Mock routes data query with proper chain
            const mockRoutesData = [
                { id: 'route-1', title: 'Test Route 1', is_public: true }
            ];
            
            // Create a separate query builder for routes that supports chaining
            const routesQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: mockRoutesData,
                    error: null
                })
            };

            // Mock follow check query
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Setup the from calls to return appropriate query builders
            mockSupabase.from
                .mockReturnValueOnce(mockQueryBuilder) // users table
                .mockReturnValueOnce(mockQueryBuilder) // routes count
                .mockReturnValueOnce(routesQueryBuilder) // routes data
                .mockReturnValueOnce(mockQueryBuilder); // user_followers check

            const result = await userService.getUserProfile('user-123', 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(result).toBeDefined();
            expect(result.id).toBe(mockUser.id);
        });

        it('should throw error if user not found', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await expect(userService.getUserProfile('nonexistent')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('searchUsers', () => {
        it('should search users by query', async () => {
            const mockUsers = [
                { id: 'user-1', username: 'testuser1', full_name: 'Test User 1' },
                { id: 'user-2', username: 'testuser2', full_name: 'Test User 2' }
            ];

            mockQueryBuilder.limit.mockResolvedValue({
                data: mockUsers,
                error: null
            });

            const result = await userService.searchUsers('test');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(result).toBeDefined();
        });

        it('should handle empty search query', async () => {
            await expect(userService.searchUsers('')).rejects.toThrow('El término de búsqueda debe tener al menos 3 caracteres');
        });

        it('should handle short search query', async () => {
            await expect(userService.searchUsers('ab')).rejects.toThrow('El término de búsqueda debe tener al menos 3 caracteres');
        });
    });

    describe('updateUserProfile', () => {
        const updateData = {
            username: 'newusername',
            bio: 'New bio'
        };

        it('should update user profile successfully', async () => {
            const mockUser = {
                id: 'user-123',
                nomada_id: 'nomada123',
                username: 'testuser'
            };

            // Mock existing user check
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            // Mock update operation
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: { ...mockUser, ...updateData },
                error: null
            });

            // Mock getUserProfile calls (count, routes data, follow check)
            mockQueryBuilder.count.mockResolvedValueOnce({
                count: 3,
                error: null
            });

            const routesQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                })
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            mockSupabase.from
                .mockReturnValueOnce(mockQueryBuilder) // user check
                .mockReturnValueOnce(mockQueryBuilder) // update
                .mockReturnValueOnce(mockQueryBuilder) // getUserProfile user data
                .mockReturnValueOnce(mockQueryBuilder) // routes count
                .mockReturnValueOnce(routesQueryBuilder) // routes data
                .mockReturnValueOnce(mockQueryBuilder); // follow check

            const result = await userService.updateUserProfile('user-123', updateData);

            expect(result).toBeDefined();
        });
    });    describe('getUserByUsername', () => {
        const mockUser = {
            id: 'user-123',
            nomada_id: 'nomada123',
            username: 'testuser',
            email: 'test@example.com',
            bio: 'Test bio'
        };
    });

    describe('updatePreferences', () => {
        const preferences = { theme: 'light', notifications: false };        it('should update user preferences successfully', async () => {
            // Create separate query builders for fetch and update operations
            const fetchQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { preferences: { existing: 'pref' } },
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
                .mockReturnValueOnce(fetchQueryBuilder) // fetch current preferences
                .mockReturnValueOnce(updateQueryBuilder); // update operation

            await userService.updatePreferences('user-123', preferences);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            // updatePreferences doesn't return anything, just check it doesn't throw
        });
    });

    describe('addVisitedCountry', () => {
        it('should add visited country successfully', async () => {
            const mockUser = { 
                id: 'user-123', 
                visited_countries: ['US', 'CA'] 
            };

            // Mock user fetch
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            // Mock update
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: { ...mockUser, visited_countries: ['US', 'CA', 'FR'] },
                error: null
            });

            await userService.addVisitedCountry('user-123', 'FR', '2024-01-01');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockQueryBuilder.update).toHaveBeenCalled();        });
    });

    describe('removeVisitedCountry', () => {
        it('should remove visited country successfully', async () => {
            const mockUser = { 
                id: 'user-123', 
                visited_countries: ['US', 'CA', 'FR'] 
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: { ...mockUser, visited_countries: ['US', 'CA'] },
                error: null
            });

            await userService.removeVisitedCountry('user-123', 'FR');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockQueryBuilder.update).toHaveBeenCalled();
        });
    });
});
