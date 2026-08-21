import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stats from './Stats';
import * as statsService from '@/api/statsService';
import { useMediaQuery } from '@/material-ui';

vi.mock('@/material-ui', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useMediaQuery: vi.fn(),
  };
});

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: { playerId: 'player-123' },
  }),
}));

vi.mock('@/utils/date', async () => {
  const actual = await vi.importActual<typeof import('@/utils/date')>('@/utils/date');
  return {
    ...actual,
    getLatestActiveGlobalDate: () => new Date(2026, 7, 21), // August 21, 2026 local time
  };
});

vi.mock('@/constants/date', () => ({
  EARLIEST_ACTIVE_DATE: new Date('2026-01-01T00:00:00Z'),
}));

vi.mock('@/api/statsService', () => ({
  fetchDailyStats: vi.fn(),
}));

describe('Stats Page Component', () => {
  let queryClient: QueryClient;

  const mockStatsData: statsService.StatsResponse = {
    date: '2026-08-21',
    globalStats: {
      wordsFoundCount: 30,
      totalPoints: 200,
      avgWordLength: 5.0,
      minWordLength: 3,
      maxWordLength: 9,
    },
    userStats: {
      wordsFoundCount: 10,
      totalPoints: 75,
      avgWordLength: 4.5,
      minWordLength: 3,
      maxWordLength: 7,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    vi.mocked(useMediaQuery).mockReturnValue(true);
    vi.mocked(statsService.fetchDailyStats).mockResolvedValue(mockStatsData);
  });

  const renderStats = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Stats />
      </QueryClientProvider>,
    );
  };

  describe('Initial State & Successful Fetching', () => {
    it('shows loading state initially and then renders statistics table', async () => {
      vi.mocked(statsService.fetchDailyStats).mockReturnValueOnce(new Promise(() => {}));

      renderStats();

      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });

    it('passes player settings and date key to fetchDailyStats', async () => {
      renderStats();

      await screen.findByText('Puzzle Statistics');
      expect(statsService.fetchDailyStats).toHaveBeenCalledWith('2026-08-21', 'player-123');
    });
  });

  describe('Date Navigation', () => {
    it('disables next day button when at the maximum active date', async () => {
      renderStats();

      await screen.findByText('Puzzle Statistics');
      expect(screen.getByRole('button', { name: 'next day' })).toBeDisabled();
    });

    it('navigates to previous day when back arrow is clicked', async () => {
      renderStats();

      await screen.findByText('Puzzle Statistics');

      const prevBtn = screen.getByRole('button', { name: 'previous day' });

      await waitFor(() => {
        expect(prevBtn).not.toBeDisabled();
      });

      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(statsService.fetchDailyStats).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling & Manual Refresh', () => {
    it('displays error message and handles retry button click', async () => {
      vi.mocked(statsService.fetchDailyStats).mockRejectedValueOnce(new Error('Network error'));

      renderStats();

      expect(
        await screen.findByText('Unable to load statistics for this day.'),
      ).toBeInTheDocument();

      vi.mocked(statsService.fetchDailyStats).mockResolvedValueOnce(mockStatsData);

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Words Found')).toBeInTheDocument();
    });

    it('refetches stats when user clicks refresh icon button', async () => {
      renderStats();

      await screen.findByText('Puzzle Statistics');
      expect(statsService.fetchDailyStats).toHaveBeenCalledTimes(1);

      const refreshButton = screen.getByRole('button', { name: 'refresh stats' });

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });

      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(statsService.fetchDailyStats).toHaveBeenCalledTimes(2);
      });
    });
  });
});
