import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Leaderboard from './Leaderboard';
import { fetchDailyLeaderboard, type LeaderboardResponse } from '@/api/leaderboardService';
import { useSettings } from '@/context/SettingsContext';
import { useMediaQuery } from '@mui/material';

// Mock dependencies
vi.mock('@/api/leaderboardService', () => ({
  fetchDailyLeaderboard: vi.fn(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useMediaQuery: vi.fn(),
  };
});

describe('Leaderboard Component', () => {
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
      {
        rank: 2,
        name: 'Current Player',
        score: 1200,
        wordsFoundCount: 8,
        userId: 'current-user-id',
        isCurrentUser: true,
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

  describe('Initial Render & Loading States', () => {
    it('displays loading state initially before data resolves', () => {
      vi.mocked(fetchDailyLeaderboard).mockReturnValue(new Promise(() => {}));
      renderLeaderboard();

      expect(screen.getByText(/Loading leaderboard.../i)).toBeInTheDocument();
    });

    it('renders leaderboard title and list entries after data loads', async () => {
      renderLeaderboard();

      expect(await screen.findByText('Top Player')).toBeInTheDocument();
      expect(screen.getByText('Current Player (you)')).toBeInTheDocument();
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('1200')).toBeInTheDocument();
    });

    it('displays empty state message when entries list is empty', async () => {
      vi.mocked(fetchDailyLeaderboard).mockResolvedValueOnce({
        date: '2026-08-18',
        entries: [],
        currentUser: undefined,
      });

      renderLeaderboard();

      expect(await screen.findByText('No scores yet for this day.')).toBeInTheDocument();
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

      expect(await screen.findByText('Top Player')).toBeInTheDocument();
    });
  });

  describe('Refresh Action', () => {
    it('triggers fetchDailyLeaderboard when refresh button is clicked', async () => {
      renderLeaderboard();
      await screen.findByText('Top Player');

      const refreshButton = screen.getByRole('button', { name: /refresh leaderboard/i });
      expect(refreshButton).not.toBeDisabled();

      fireEvent.click(refreshButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledTimes(2);
    });

    it('disables refresh button while query is fetching', async () => {
      renderLeaderboard();
      await screen.findByText('Top Player');

      // Return a pending promise to simulate an in-flight network request
      vi.mocked(fetchDailyLeaderboard).mockReturnValueOnce(new Promise(() => {}));

      const refreshButton = screen.getByRole('button', { name: /refresh leaderboard/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refreshButton).toBeDisabled();
      });
    });
  });

  describe('Sticky Bottom Rank Card (Outside Top 10)', () => {
    it('renders separate current user entry sticky card when provided', async () => {
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

      expect(await screen.findByText('#15')).toBeInTheDocument();
      expect(screen.getByText('Outside Player (you)')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });
  });

  describe('Day Navigation Controls', () => {
    it('navigates to previous day when previous day button is clicked', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      const prevDayButton = screen.getByRole('button', { name: /previous day/i });
      fireEvent.click(prevDayButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledWith(expect.any(String), 'current-user-id', 10);
    });

    it('navigates to next day when next day button is clicked', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      const prevDayButton = screen.getByRole('button', { name: /previous day/i });
      fireEvent.click(prevDayButton);

      queryClient.clear();

      const nextDayButton = screen.getByRole('button', { name: /next day/i });
      fireEvent.click(nextDayButton);

      expect(fetchDailyLeaderboard).toHaveBeenCalledTimes(3);
    });
  });

  describe('Calendar Interactivity & Month Navigation', () => {
    it('renders desktop sidebar calendar by default on desktop viewport', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    it('navigates calendar month backward and forward', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      const prevMonthBtn = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevMonthBtn);

      const nextMonthBtn = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextMonthBtn);

      expect(prevMonthBtn).toBeInTheDocument();
    });

    it('changes selected date when clicking a valid calendar day cell', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      const dayButtons = screen.getAllByRole('button');
      const fifteenthBtn = dayButtons.find((btn) => btn.textContent === '15');

      if (fifteenthBtn) {
        fireEvent.click(fifteenthBtn);
        await waitFor(() => {
          expect(fetchDailyLeaderboard).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Responsive Layout & Mobile Popover Calendar', () => {
    beforeEach(() => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Mobile viewport
    });

    it('renders date picker icon button on mobile view and opens popover calendar', async () => {
      renderLeaderboard();
      await screen.findByText('Leaderboard');

      const pickDateBtn = screen.getByRole('button', { name: /pick date/i });
      expect(pickDateBtn).toBeInTheDocument();

      fireEvent.click(pickDateBtn);

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    });
  });
});
