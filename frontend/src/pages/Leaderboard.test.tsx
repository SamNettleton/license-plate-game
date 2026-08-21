import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Leaderboard from './Leaderboard';
import { fetchDailyLeaderboard, type LeaderboardResponse } from '@/api/leaderboardService';
import { useSettings } from '@/context/SettingsContext';
import { useMediaQuery } from '@/material-ui';

// Mock dependencies
vi.mock('@/api/leaderboardService', () => ({
  fetchDailyLeaderboard: vi.fn(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/material-ui', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useMediaQuery: vi.fn(),
  };
});

// Mock child component to isolate Leaderboard container tests
vi.mock('@/components/results/LeaderboardTable', () => ({
  default: vi.fn(({ entries, currentUser }) => (
    <div data-testid="leaderboard-table">
      <span>Entries Count: {entries.length}</span>
      {currentUser && <span>Has Current User</span>}
    </div>
  )),
}));

describe('Leaderboard Container Component', () => {
  let queryClient: QueryClient;

  const mockLeaderboardData: LeaderboardResponse = {
    date: '2026-08-18',
    entries: [
      {
        rank: 1,
        name: 'Top Player',
        score: 1500,
        wordsFoundCount: 10,
        userId: 'user-1',
        isCurrentUser: false,
      },
    ],
    currentUser: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(useSettings).mockReturnValue({
      settings: { playerId: 'current-user-id' } as any,
      updateSettings: vi.fn(),
    });

    // Default to Desktop view
    vi.mocked(useMediaQuery).mockReturnValue(true);
    vi.mocked(fetchDailyLeaderboard).mockResolvedValue(mockLeaderboardData);
  });

  const renderLeaderboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Leaderboard />
      </QueryClientProvider>,
    );
  };

  describe('Data Fetching & Table Integration', () => {
    it('displays loading state initially before data resolves', () => {
      vi.mocked(fetchDailyLeaderboard).mockReturnValue(new Promise(() => {}));
      renderLeaderboard();

      expect(screen.getByText(/Loading leaderboard.../i)).toBeInTheDocument();
    });

    it('passes fetched data directly to LeaderboardTable component', async () => {
      renderLeaderboard();

      const table = await screen.findByTestId('leaderboard-table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText('Entries Count: 1')).toBeInTheDocument();
    });

    it('passes currentUser entry down to LeaderboardTable when present', async () => {
      vi.mocked(fetchDailyLeaderboard).mockResolvedValueOnce({
        ...mockLeaderboardData,
        currentUser: {
          rank: 15,
          name: 'Outside Player',
          score: 450,
          wordsFoundCount: 3,
          userId: 'current-user-id',
          isCurrentUser: true,
        },
      });

      renderLeaderboard();

      await screen.findByTestId('leaderboard-table');
      expect(screen.getByText('Has Current User')).toBeInTheDocument();
    });

    it('renders error state and handles retry action on API failure', async () => {
      vi.mocked(fetchDailyLeaderboard).mockRejectedValueOnce(new Error('Network error'));

      renderLeaderboard();

      expect(
        await screen.findByText('Unable to load the leaderboard for this day.'),
      ).toBeInTheDocument();

      vi.mocked(fetchDailyLeaderboard).mockResolvedValueOnce(mockLeaderboardData);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(await screen.findByTestId('leaderboard-table')).toBeInTheDocument();
    });
  });

  describe('Refresh Actions', () => {
    it('triggers fetchDailyLeaderboard when refresh button is clicked', async () => {
      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      const refreshButton = screen.getByRole('button', { name: /refresh leaderboard/i });
      fireEvent.click(refreshButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledTimes(2);
    });

    it('disables refresh button while query is fetching', async () => {
      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      vi.mocked(fetchDailyLeaderboard).mockReturnValueOnce(new Promise(() => {}));

      const refreshButton = screen.getByRole('button', { name: /refresh leaderboard/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refreshButton).toBeDisabled();
      });
    });
  });

  describe('Day Navigation Controls', () => {
    it('navigates to previous day when previous day button is clicked', async () => {
      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      const prevDayButton = screen.getByRole('button', { name: /previous day/i });
      fireEvent.click(prevDayButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledWith(expect.any(String), 'current-user-id', 10);
    });

    it('navigates to next day when next day button is clicked', async () => {
      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      const prevDayButton = screen.getByRole('button', { name: /previous day/i });
      fireEvent.click(prevDayButton);

      queryClient.clear();

      const nextDayButton = screen.getByRole('button', { name: /next day/i });
      fireEvent.click(nextDayButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledTimes(3);
    });
  });

  describe('Responsive Layout & Calendar Integration', () => {
    it('renders desktop sidebar calendar by default on desktop viewport', async () => {
      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    it('renders date picker button and opens popover calendar on mobile viewport', async () => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Mobile viewport

      renderLeaderboard();
      await screen.findByTestId('leaderboard-table');

      const pickDateBtn = screen.getByRole('button', { name: /pick date/i });
      expect(pickDateBtn).toBeInTheDocument();

      fireEvent.click(pickDateBtn);

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    });
  });
});
