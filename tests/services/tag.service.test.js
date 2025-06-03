const tagService = require('../../src/services/tag.service.js');
const { supabase } = require('../../src/db/supabase');

// Mock dependencies
jest.mock('../../src/db/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('TagService', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis()
    };

    supabase.from.mockReturnValue(mockQueryBuilder);
  });

  describe('saveTags', () => {
    const validTagData = {
      tags: ['travel', 'vacation', 'beach'],
      userId: 'user-123',
      timestamp: '2023-01-01T00:00:00Z'
    };

    it('should save tags successfully', async () => {
      const mockData = [
        { id: 'tag-1', tag_name: 'travel', user_id: 'user-123' },
        { id: 'tag-2', tag_name: 'vacation', user_id: 'user-123' },
        { id: 'tag-3', tag_name: 'beach', user_id: 'user-123' }
      ];

      mockQueryBuilder.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await tagService.saveTags(validTagData);

      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        {
          tag_name: 'travel',
          user_id: 'user-123',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          tag_name: 'vacation',
          user_id: 'user-123',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          tag_name: 'beach',
          user_id: 'user-123',
          created_at: '2023-01-01T00:00:00Z'
        }
      ]);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should use current timestamp when not provided', async () => {
      const tagDataWithoutTimestamp = {
        tags: ['adventure'],
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'tag-1' }],
        error: null
      });

      await tagService.saveTags(tagDataWithoutTimestamp);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tag_name: 'adventure',
          user_id: 'user-123',
          created_at: expect.any(String)
        })
      ]);
    });

    it('should return empty array when no tags provided', async () => {
      const emptyTagData = {
        tags: [],
        userId: 'user-123'
      };

      const result = await tagService.saveTags(emptyTagData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: [] });
    });

    it('should return empty array when tags is null', async () => {
      const nullTagData = {
        tags: null,
        userId: 'user-123'
      };

      const result = await tagService.saveTags(nullTagData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: [] });
    });

    it('should return empty array when tags is undefined', async () => {
      const undefinedTagData = {
        userId: 'user-123'
      };

      const result = await tagService.saveTags(undefinedTagData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: [] });
    });

    it('should return empty array when tags is not an array', async () => {
      const invalidTagData = {
        tags: 'not-an-array',
        userId: 'user-123'
      };

      const result = await tagService.saveTags(invalidTagData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: [] });
    });

    it('should handle single tag', async () => {
      const singleTagData = {
        tags: ['solo-travel'],
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'tag-1', tag_name: 'solo-travel' }],
        error: null
      });

      const result = await tagService.saveTags(singleTagData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tag_name: 'solo-travel',
          user_id: 'user-123'
        })
      ]);
      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(tagService.saveTags(validTagData))
        .rejects.toThrow('Error al guardar etiquetas: Database error');
    });

    it('should handle special characters in tags', async () => {
      const specialTagData = {
        tags: ['café-culture', 'música-local', '山登り'],
        userId: 'user-123'
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [
          { id: 'tag-1', tag_name: 'café-culture' },
          { id: 'tag-2', tag_name: 'música-local' },
          { id: 'tag-3', tag_name: '山登り' }
        ],
        error: null
      });

      const result = await tagService.saveTags(specialTagData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        expect.objectContaining({ tag_name: 'café-culture' }),
        expect.objectContaining({ tag_name: 'música-local' }),
        expect.objectContaining({ tag_name: '山登り' })
      ]);
      expect(result.success).toBe(true);
    });

    it('should handle insert operation errors', async () => {
      mockQueryBuilder.select.mockImplementation(() => {
        throw new Error('Insert operation failed');
      });

      await expect(tagService.saveTags(validTagData))
        .rejects.toThrow('Error al guardar etiquetas: Insert operation failed');
    });
  });
});
