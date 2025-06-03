const FollowService = require('../../src/services/follow.service.js');

describe('FollowService', () => {
  let followService;
  let mockSupabase;
  let mockQueryBuilder;

  beforeEach(() => {
    // Mock Supabase Query Builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
    };

    // Mock Supabase Client
    mockSupabase = {
      from: jest.fn(() => mockQueryBuilder)
    };

    followService = new FollowService(mockSupabase);
  });

  describe('constructor', () => {
    it('should throw error if supabase client not provided', () => {
      expect(() => new FollowService(null))
        .toThrow('Cliente de Supabase no disponible');
    });

    it('should initialize with supabase client', () => {
      expect(followService.supabase).toBe(mockSupabase);
    });
  });

  describe('followUser', () => {
    it('should throw error if trying to follow self', async () => {
      await expect(followService.followUser('user-123', 'user-123'))
        .rejects.toThrow('No puedes seguirte a ti mismo');
    });

    it('should throw error if target user does not exist', async () => {
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(followService.followUser('user-123', 'user-456'))
        .rejects.toThrow('El usuario que intentas seguir no existe');
    });

    it('should return message if already following', async () => {
      // Mock target user exists
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'user-456' },
        error: null
      });

      // Mock existing follow relationship
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: 'follow-123' },
        error: null
      });

      const result = await followService.followUser('user-123', 'user-456');

      expect(result).toEqual({
        success: true,
        message: 'Ya sigues a este usuario',
        isNew: false
      });
    });

    it('should create new follow relationship successfully', async () => {
      // Mock target user exists
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'user-456' },
        error: null
      });

      // Mock no existing follow relationship
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock successful insert
      mockQueryBuilder.insert = jest.fn().mockResolvedValue({
        error: null
      });

      const result = await followService.followUser('user-123', 'user-456');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_follows');
      expect(result).toEqual({
        success: true,
        message: 'Usuario seguido correctamente',
        isNew: true
      });
    });

    it('should handle follow creation errors', async () => {
      // Mock target user exists
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'user-456' },
        error: null
      });

      // Mock no existing follow relationship
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock insert error
      mockQueryBuilder.insert = jest.fn().mockResolvedValue({
        error: { message: 'Insert failed' }
      });

      await expect(followService.followUser('user-123', 'user-456'))
        .rejects.toThrow('Error al seguir al usuario: Insert failed');
    });
  });

  describe('unfollowUser', () => {
    it('should return message if not following', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await followService.unfollowUser('user-123', 'user-456');

      expect(result).toEqual({
        success: true,
        message: 'No sigues a este usuario'
      });
    });

    it('should unfollow user successfully', async () => {
      // Mock existing follow relationship
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: 'follow-123' },
        error: null
      });      // Mock successful delete with proper chaining
      const mockDeleteChain = {
        eq: jest.fn().mockReturnThis()
      };
      mockDeleteChain.eq.mockResolvedValue({ error: null });
      mockQueryBuilder.delete = jest.fn().mockReturnValue(mockDeleteChain);

      const result = await followService.unfollowUser('user-123', 'user-456');

      expect(result).toEqual({
        success: true,
        message: 'Has dejado de seguir al usuario'
      });
    });

    it('should handle unfollow errors', async () => {
      // Mock existing follow relationship
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: 'follow-123' },
        error: null
      });      // Mock delete error with proper chaining
      const mockDeleteChain = {
        eq: jest.fn().mockReturnThis()
      };
      mockDeleteChain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });
      mockQueryBuilder.delete = jest.fn().mockReturnValue(mockDeleteChain);

      await expect(followService.unfollowUser('user-123', 'user-456'))
        .rejects.toThrow('Error al dejar de seguir al usuario: Delete failed');
    });
  });

  describe('getFollowers', () => {
    it('should get followers successfully', async () => {
      const mockFollowers = [
        { follower: { id: 'user-1', username: 'user1', full_name: 'User One' } },
        { follower: { id: 'user-2', username: 'user2', full_name: 'User Two' } }
      ];

      mockQueryBuilder.range.mockResolvedValueOnce({
        data: mockFollowers,
        error: null
      });

      const result = await followService.getFollowers('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_follows');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('following_id', 'user-123');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'user-1', username: 'user1', full_name: 'User One' });
    });

    it('should handle pagination parameters', async () => {
      mockQueryBuilder.range.mockResolvedValueOnce({
        data: [],
        error: null
      });

      await followService.getFollowers('user-123', 10, 5);

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 14);
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(followService.getFollowers('user-123'))
        .rejects.toThrow('Error al obtener seguidores: Query failed');
    });
  });

  describe('getFollowing', () => {
    it('should get following users successfully', async () => {
      const mockFollowing = [
        { following: { id: 'user-1', username: 'user1', full_name: 'User One' } },
        { following: { id: 'user-2', username: 'user2', full_name: 'User Two' } }
      ];

      mockQueryBuilder.range.mockResolvedValueOnce({
        data: mockFollowing,
        error: null
      });

      const result = await followService.getFollowing('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_follows');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('follower_id', 'user-123');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'user-1', username: 'user1', full_name: 'User One' });
    });
  });

  describe('isFollowing', () => {
    it('should return true if following', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: 'follow-123' },
        error: null
      });

      const result = await followService.isFollowing('user-123', 'user-456');

      expect(result).toBe(true);
    });

    it('should return false if not following', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await followService.isFollowing('user-123', 'user-456');

      expect(result).toBe(false);
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(followService.isFollowing('user-123', 'user-456'))
        .rejects.toThrow('Error al verificar relación: Query failed');
    });
  });
});
