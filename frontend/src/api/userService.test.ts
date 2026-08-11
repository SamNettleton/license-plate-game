import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncUser } from './userService';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: mockPost,
    })),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncUser', () => {
    it('sends a POST request to /users/sync with the formatted user payload', async () => {
      mockPost.mockResolvedValueOnce({ data: { status: 'synced' } });

      const userId = 'test-uuid-1234';
      const displayName = 'Speedy Driver';

      await syncUser(userId, displayName);

      expect(mockPost).toHaveBeenCalledOnce();
      expect(mockPost).toHaveBeenCalledWith('/users/sync', {
        user_id: userId,
        display_name: displayName,
      });
    });

    it('resolves without error on a successful API response', async () => {
      mockPost.mockResolvedValueOnce({ status: 200, data: { status: 'synced' } });

      await expect(syncUser('user-123', 'Test User')).resolves.not.toThrow();
    });

    it('propagates the error when the network request fails', async () => {
      const networkError = new Error('Network Error');
      mockPost.mockRejectedValueOnce(networkError);

      await expect(syncUser('user-123', 'Test User')).rejects.toThrow('Network Error');
    });
  });
});
