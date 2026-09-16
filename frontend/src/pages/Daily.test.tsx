import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Daily from './Daily';
import * as plateService from '../api/plateService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getLocalDailyDate, formatDateKey } from '@/utils/date';
import { EARLIEST_ACTIVE_DATE } from '@/constants/date';

// Mock react-router-dom search params hooks
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

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

  const mockDailyPlate = {
    sequence: 'DAY',
    solutionsCount: 10,
    goalPoints: 20,
    wordsFound: ['daylight'],
    pointsEarned: 10,
    elapsedSeconds: 45,
    tierTimes: { Bronze: 30 },
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Data Loading and Rendering', () => {
    it('renders loading state initially and then displays the game on success', async () => {
      const today = getLocalDailyDate();
      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      expect(screen.getByText(/Crafting daily plate.../i)).toBeInTheDocument();

      const gameElement = await screen.findByTestId('mock-game');
      expect(gameElement).toBeInTheDocument();

      expect(plateService.fetchDailyPlate).toHaveBeenCalledTimes(1);
      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
    });

    it('passes all daily puzzle properties down to the Game component', async () => {
      const today = getLocalDailyDate();
      const mockFullPlate = {
        sequence: 'LPG',
        solutionsCount: 15,
        goalPoints: 100,
        wordsFound: ['leapfrog', 'limping'],
        pointsEarned: 23,
        elapsedSeconds: 120,
        tierTimes: { Parked: 15, 'Good Start': 45 },
      };

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockFullPlate);

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

  describe('URL Date Parameter Handling', () => {
    it('fetches puzzle for valid target date supplied in query string', async () => {
      const validDate = formatDateKey(EARLIEST_ACTIVE_DATE);
      mockSearchParams = new URLSearchParams({ date: validDate });

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await screen.findByTestId('mock-game');

      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', validDate);
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('strips parameter if target date matches local today date', async () => {
      const today = getLocalDailyDate();
      mockSearchParams = new URLSearchParams({ date: today });

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await screen.findByTestId('mock-game');

      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
      expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), { replace: true });
    });

    it('falls back to local daily date and strips parameter if date format is invalid', async () => {
      mockSearchParams = new URLSearchParams({ date: 'invalid-date-format' });
      const today = getLocalDailyDate();

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await screen.findByTestId('mock-game');

      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });

    it('falls back to local daily date and strips parameter if date is before EARLIEST_ACTIVE_DATE', async () => {
      mockSearchParams = new URLSearchParams({ date: '2020-01-01' });
      const today = getLocalDailyDate();

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await screen.findByTestId('mock-game');

      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });

    it('falls back to local daily date and strips parameter if date exceeds getLatestActiveGlobalDate', async () => {
      mockSearchParams = new URLSearchParams({ date: '2099-12-31' });
      const today = getLocalDailyDate();

      vi.mocked(plateService.fetchDailyPlate).mockResolvedValue(mockDailyPlate);

      render(<Daily />, { wrapper });

      await screen.findByTestId('mock-game');

      expect(plateService.fetchDailyPlate).toHaveBeenCalledWith('test-player-123', today);
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });
  });
});
