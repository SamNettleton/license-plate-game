import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Daily from './Daily';
import * as plateService from '../api/plateService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getLocalDailyDate } from '@/utils/date';

// Mock plateService API
vi.mock('../api/plateService', () => ({
  fetchDailyPlate: vi.fn(),
}));

// Mock SettingsContext
vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      playerId: 'test-player-123',
      displayName: 'Test Traveler',
      displayTimeOption: 'resultsOnly',
      isDarkTheme: true,
    },
    updateSettings: vi.fn(),
  }),
}));

// Mock Game component to isolate page behavior
vi.mock('@/components/game/Game', () => ({
  default: vi.fn((props) => (
    <div data-testid="mock-game">
      <span>Plate: {props.plate}</span>
      <span>Solutions: {props.solutionsCount}</span>
      <span>Goal: {props.goalPoints}</span>
      <span>Words Found: {props.wordsFound.join(',')}</span>
      <span>Points: {props.pointsEarned}</span>
      <span>Elapsed: {props.elapsedSeconds}</span>
      <span>Mode: {props.mode}</span>
      <span>Date: {props.puzzleDate}</span>
      <span>User: {props.userId}</span>
    </div>
  )),
}));

// Mock Grafana Faro telemetry
vi.mock('@/App', () => ({
  faro: {
    api: {
      pushError: vi.fn(),
      pushLog: vi.fn(),
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Daily Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Data Loading and Rendering', () => {
    it('renders loading state initially and then displays the game on success', async () => {
      const today = getLocalDailyDate();
      const mockDailyPlate = {
        sequence: 'DAY',
        solutionsCount: 10,
        goalPoints: 20,
        wordsFound: ['daylight'],
        pointsEarned: 10,
        elapsedSeconds: 45,
        tierTimes: { Bronze: 30 },
      };

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      expect(screen.getByText(/Crafting a daily plate/i)).toBeInTheDocument();

      const gameElement = await screen.findByTestId('mock-game');
      expect(gameElement).toBeInTheDocument();

      expect(plateService.fetchDailyPlate).toHaveBeenCalledTimes(1);
      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
    });

    it('passes all daily puzzle properties down to the Game component', async () => {
      const today = getLocalDailyDate();
      const mockDailyPlate = {
        sequence: 'LPG',
        solutionsCount: 15,
        goalPoints: 100,
        wordsFound: ['leapfrog', 'limping'],
        pointsEarned: 23,
        elapsedSeconds: 120,
        tierTimes: { Parked: 15, 'Good Start': 45 },
      };

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Plate: LPG')).toBeInTheDocument();
        expect(screen.getByText('Solutions: 15')).toBeInTheDocument();
        expect(screen.getByText('Goal: 100')).toBeInTheDocument();
        expect(screen.getByText('Words Found: leapfrog,limping')).toBeInTheDocument();
        expect(screen.getByText('Points: 23')).toBeInTheDocument();
        expect(screen.getByText('Elapsed: 120')).toBeInTheDocument();
        expect(screen.getByText('Mode: daily')).toBeInTheDocument();
        expect(screen.getByText(`Date: ${today}`)).toBeInTheDocument();
        expect(screen.getByText('User: test-player-123')).toBeInTheDocument();
      });
    });

    it('renders error state when the API call fails', async () => {
      vi.mocked(plateService.fetchDailyPlate).mockRejectedValue(new Error('Network Error'));

      render(<Daily />, { wrapper });

      const errorMsg = await screen.findByText(/Network Error/i);
      expect(errorMsg).toBeInTheDocument();
    });
  });
});
