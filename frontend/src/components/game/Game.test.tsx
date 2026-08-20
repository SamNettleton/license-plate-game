import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Game from './Game';
import { GameMode } from '@/constants/game';
import * as wordService from '@/api/wordService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock wordService API calls
vi.mock('@/api/wordService', () => ({
  checkWordValidity: vi.fn(),
}));

// Mock Grafana Faro telemetry import
vi.mock('@/App', () => ({
  faro: {
    api: {
      pushError: vi.fn(),
      pushLog: vi.fn(),
    },
  },
}));

describe('Game Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('Initial Render', () => {
    it('renders without crashing and displays initial plate and progress', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Game
            plate="LPG"
            solutionsCount={10}
            goalPoints={100}
            mode={GameMode.DAILY}
          />
        </QueryClientProvider>,
      );

      expect(screen.getByText(/LPG/i)).toBeInTheDocument();

      const scoreElements = screen.getAllByText(/0.*\/.*100/i);
      expect(scoreElements[0]).toBeInTheDocument();
    });
  });

  describe('Gameplay & Submissions', () => {
    it('updates points and adds a solution on a valid guess', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: true,
        points: 10,
        message: 'Great job!',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game
            plate="LPG"
            solutionsCount={10}
            goalPoints={100}
            mode={GameMode.DAILY}
          />
        </QueryClientProvider>,
      );

      await user.keyboard('LEAPFROG{Enter}');

      await waitFor(() => {
        const elements = screen.getAllByText(/Leapfrog/i);
        expect(elements.length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        const elements = screen.getAllByText(/10.*\/.*100/i);
        expect(elements[0]).toBeInTheDocument();
      });
    });

    it('forwards userId and puzzleDate to the API in daily mode', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: true,
        points: 10,
        message: 'Great job!',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game
            plate="LPG"
            solutionsCount={10}
            goalPoints={100}
            mode={GameMode.DAILY}
            puzzleDate="2026-08-11"
            userId="test-user-id"
          />
        </QueryClientProvider>,
      );

      await user.keyboard('LEAPFROG{Enter}');

      await waitFor(() => {
        expect(wordService.checkWordValidity).toHaveBeenCalledWith(
          'leapfrog',
          'LPG',
          'test-user-id',
          '2026-08-11',
        );
      });
    });

    it('prevents duplicate API calls for the same word', async () => {
      const user = userEvent.setup();

      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: true,
        points: 10,
        message: 'Great job!',
      });

      render(
        <QueryClientProvider client={queryClient}>
          <Game
            plate="LPG"
            solutionsCount={10}
            goalPoints={100}
            mode={GameMode.DAILY}
          />
        </QueryClientProvider>,
      );

      vi.mocked(wordService.checkWordValidity).mockClear();

      await user.keyboard('LIMPING{Enter}');

      await waitFor(() => {
        const elements = screen.getAllByText(/Limping/i);
        expect(elements.length).toBeGreaterThan(0);
      });
      expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);

      await user.keyboard('LIMPING{Enter}');

      expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);
      expect(await screen.findByText(/Already found/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays an error message and logs to faro when the API call fails', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network Error');

      vi.mocked(wordService.checkWordValidity).mockRejectedValue(networkError);

      render(
        <QueryClientProvider client={queryClient}>
          <Game
            plate="FAL"
            solutionsCount={10}
            goalPoints={100}
            mode={GameMode.DAILY}
          />
        </QueryClientProvider>,
      );

      await user.keyboard('FAIL{Enter}');

      expect(
        await screen.findByText(/An error occurred while checking your guess/i),
      ).toBeInTheDocument();
    });
  });
});
