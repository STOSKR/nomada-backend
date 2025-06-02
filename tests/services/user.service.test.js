/**
 * Unit tests for UserService
 */

const UserService = require('../../src/services/user.service');

describe('UserService', () => {
    let userService;
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
            count: 'exact',
            head: true,
            in: jest.fn(() => mockSupabase),
            neq: jest.fn(() => mockSupabase),
            ilike: jest.fn(() => mockSupabase),
            order: jest.fn(() => mockSupabase),
            limit: jest.fn(() => mockSupabase),
            range: jest.fn(() => mockSupabase)
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
            mockSupabase.single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            // Mock routes count
            mockSupabase.single.mockResolvedValueOnce({
                count: 3,
                error: null
            });

            const result = await userService.getUserProfile('user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.select).toHaveBeenCalledWith(
                'id, nomada_id, username, email, bio, avatar_url, preferences, visited_countries, followers_count, following_count'
            );
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
            expect(result).toBeDefined();
        });

        it('should throw error if user not found', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await expect(userService.getUserProfile('nonexistent')).rejects.toThrow('Usuario no encontrado');
        });

        it('should throw error if database error occurs', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Database error' }
            });

            await expect(userService.getUserProfile('user-123')).rejects.toThrow('Error al obtener perfil del usuario');
        });
    });

    describe('searchUsers', () => {
        it('should search users by query', async () => {
            const mockUsers = [
                { id: 'user-1', username: 'testuser1', nomada_id: 'nomada1' },
                { id: 'user-2', username: 'testuser2', nomada_id: 'nomada2' }
            ];

            mockSupabase.single.mockResolvedValue({
                data: mockUsers,
                error: null
            });

            const result = await userService.searchUsers('test');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should handle empty search query', async () => {
            await expect(userService.searchUsers('')).rejects.toThrow();
        });
    });

    describe('updateUserProfile', () => {
        const updateData = {
            username: 'newusername',
            bio: 'New bio',
            avatar_url: 'https://example.com/new-avatar.jpg'
        };

        it('should update user profile successfully', async () => {
            const mockUpdatedUser = { id: 'user-123', ...updateData };

            mockSupabase.single.mockResolvedValue({
                data: mockUpdatedUser,
                error: null
            });

            const result = await userService.updateUserProfile('user-123', updateData);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.update).toHaveBeenCalledWith(updateData);
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
            expect(result).toBeDefined();
        });

        it('should throw error if update fails', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
            });

            await expect(userService.updateUserProfile('user-123', updateData))
                .rejects.toThrow();
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: null
            });

            await userService.deleteUser('user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should throw error if deletion fails', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'Deletion failed' }
            });

            await expect(userService.deleteUser('user-123')).rejects.toThrow();
        });
    });

    describe('followUser', () => {
        it('should follow user successfully', async () => {
            // Mock check existing follow (none found)
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock insert follow
            mockSupabase.single.mockResolvedValueOnce({
                data: { follower_id: 'user-1', followed_id: 'user-2' },
                error: null
            });

            const result = await userService.followUser('user-1', 'user-2');

            expect(mockSupabase.from).toHaveBeenCalledWith('follows');
            expect(result).toBeDefined();
        });

        it('should throw error if already following', async () => {
            mockSupabase.single.mockResolvedValue({
                data: { follower_id: 'user-1', followed_id: 'user-2' },
                error: null
            });

            await expect(userService.followUser('user-1', 'user-2'))
                .rejects.toThrow();
        });

        it('should throw error if trying to follow oneself', async () => {
            await expect(userService.followUser('user-1', 'user-1'))
                .rejects.toThrow();
        });
    });

    describe('unfollowUser', () => {
        it('should unfollow user successfully', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: null
            });

            await userService.unfollowUser('user-1', 'user-2');

            expect(mockSupabase.from).toHaveBeenCalledWith('follows');
            expect(mockSupabase.delete).toHaveBeenCalled();
        });

        it('should throw error if unfollow fails', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'Unfollow failed' }
            });

            await expect(userService.unfollowUser('user-1', 'user-2'))
                .rejects.toThrow();
        });
    });

    describe('getUserFollowers', () => {
        it('should get user followers successfully', async () => {
            const mockFollowers = [
                { id: 'user-1', username: 'follower1' },
                { id: 'user-2', username: 'follower2' }
            ];

            mockSupabase.single.mockResolvedValue({
                data: mockFollowers,
                error: null
            });

            const result = await userService.getUserFollowers('user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('follows');
            expect(result).toBeDefined();
        });

        it('should handle user with no followers', async () => {
            mockSupabase.single.mockResolvedValue({
                data: [],
                error: null
            });

            const result = await userService.getUserFollowers('user-123');
            expect(result).toBeDefined();
        });
    });

    describe('getUserFollowing', () => {
        it('should get users being followed successfully', async () => {
            const mockFollowing = [
                { id: 'user-1', username: 'following1' },
                { id: 'user-2', username: 'following2' }
            ];

            mockSupabase.single.mockResolvedValue({
                data: mockFollowing,
                error: null
            });

            const result = await userService.getUserFollowing('user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('follows');
            expect(result).toBeDefined();
        });
    });

    describe('updateVisitedCountries', () => {
        it('should update visited countries successfully', async () => {
            const countries = ['ES', 'FR', 'IT'];
            
            mockSupabase.single.mockResolvedValue({
                data: { visited_countries: countries },
                error: null
            });

            const result = await userService.updateVisitedCountries('user-123', countries);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.update).toHaveBeenCalledWith({ visited_countries: countries });
            expect(result).toBeDefined();
        });

        it('should throw error if countries is not an array', async () => {
            await expect(userService.updateVisitedCountries('user-123', 'invalid'))
                .rejects.toThrow();
        });
    });

    describe('updateUserPreferences', () => {
        it('should update user preferences successfully', async () => {
            const preferences = { theme: 'dark', language: 'es' };
            
            mockSupabase.single.mockResolvedValue({
                data: { preferences },
                error: null
            });

            const result = await userService.updateUserPreferences('user-123', preferences);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.update).toHaveBeenCalledWith({ preferences });
            expect(result).toBeDefined();
        });

        it('should throw error if preferences is not an object', async () => {
            await expect(userService.updateUserPreferences('user-123', 'invalid'))
                .rejects.toThrow();
        });
    });
});
