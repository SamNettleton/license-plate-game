import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Practice from './Practice';
import * as plateService from '../api/plateService';
import { vi } from 'vitest';

vi.mock('../api/plateService', () => ({
  fetchRandomPlate: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Practice', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('shows loading state then renders the game', async () => {
    const mockPlate = { sequence: 'ABC', solutionsCount: 5, goalPoints: 10 };
    (plateService.fetchRandomPlate as any).mockResolvedValue(mockPlate);

    render(<Practice />, { wrapper });

    expect(screen.getByText(/Crafting a random plate/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ABC')).toBeInTheDocument();
    });

    expect(localStorage.getItem('lp_practice_current_plate')).toContain('ABC');
  });

  it('loads directly from localStorage if data exists', async () => {
    const savedPlate = { sequence: 'XYZ', solutionsCount: 3, goalPoints: 5 };
    localStorage.setItem('lp_practice_current_plate', JSON.stringify(savedPlate));

    render(<Practice />, { wrapper });

    // Should find XYZ immediately without calling the API
    await waitFor(() => {
      expect(screen.getByText('XYZ')).toBeInTheDocument();
    });
    expect(plateService.fetchRandomPlate).not.toHaveBeenCalled();
  });

  it('renders error state when the API fails', async () => {
    (plateService.fetchRandomPlate as any).mockRejectedValue(new Error('Network Error'));

    render(<Practice />, { wrapper });

    const errorMsg = await screen.findByText(/Network Error/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
