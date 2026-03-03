import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDailyPlate, fetchRandomPlate } from './plateService';

const mockApiInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockApiInstance),
    },
  };
});

describe('plateService utility functions', () => {
    
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchRandomPlate transforms snake_case to camelCase', async () => {
    const mockApiResponse = {
      data: {
        sequence: 'XYZ',
        total_count: 55,
        goal_points: 300,
      }
    };
    
    mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

    const result = await fetchRandomPlate();

    expect(mockApiInstance.get).toHaveBeenCalledWith('/plate/random');
    
    expect(result).toEqual({
      sequence: 'XYZ',
      solutionsCount: 55,
      goalPoints: 300
    });
  });

  it('fetchDailyPlate uses the correct date and transforms snake_case', async () => {
    const mockApiResponse = {
      data: {
        sequence: 'ABC',
        total_count: 10,
        goal_points: 60,
      }
    };

    mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

    const result = await fetchDailyPlate();

    expect(mockApiInstance.get).toHaveBeenCalled();
    const calledUrl = mockApiInstance.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/plate/daily?date=');
    
    expect(result).toEqual({
      sequence: 'ABC',
      solutionsCount: 10,
      goalPoints: 60
    });
  });
});
