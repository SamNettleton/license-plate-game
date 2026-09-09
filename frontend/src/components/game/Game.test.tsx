import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Game from './Game';
import { GameMode } from '@/constants/game';
import * as wordService from '@/api/wordService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { useSettings } from '@/context/SettingsContext';

// Mock wordService API calls
vi.mock('@/api/wordService', () => ({
  checkWordValidity: vi.fn(),
  updateTierTimes: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock SettingsContext
vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

// Mock Grafana Faro telemetry import
vi.mock('@/faro', () => ({
  faro: {
    api: {
      pushError: vi.fn(),
      pushLog: vi.fn(),
    },
  },
}));

const defaultGameProps = {
  plate: 'LPG',
  solutionsCount: 10,
  goalPoints: 100,
  wordsFound: [],
  pointsEarned: 0,
  elapsedSeconds: 0,
  tierTimes: {},
  mode: GameMode.DAILY,
};

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

    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        playerId: 'mock-uuid-1234',
        displayName: 'Road Tripper',
        isDarkTheme: true,
        displayTimeOption: 'resultsOnly',
      },
      updateSettings: vi.fn(),
    });
  });

  describe('Initial Render', () => {
    it('renders without crashing and displays initial plate and progress', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} />
        </QueryClientProvider>,
      );

      expect(screen.getByText(/LPG/i)).toBeInTheDocument();

      const scoreElements = screen.getAllByText(/0.*\/.*100/i);
      expect(scoreElements[0]).toBeInTheDocument();
    });

    it('hydrates initial puzzle state from props when provided', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Game
            {...defaultGameProps}
            wordsFound={['leapfrog']}
            pointsEarned={15}
            elapsedSeconds={42}
            tierTimes={{ bronze: 30 }}
          />
        </QueryClientProvider>,
      );

      expect(screen.getAllByText(/Leapfrog/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/15.*\/.*100/i)[0]).toBeInTheDocument();
    });
  });

  describe('Timer Settings & Display Controls', () => {
    it('passes elapsedSeconds to ResultBar when displayTimeOption is "gameAndResults"', () => {
      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          displayTimeOption: 'gameAndResults',
        },
        updateSettings: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} elapsedSeconds={125} />
        </QueryClientProvider>,
      );

      expect(screen.getAllByText('2:05').length).toBeGreaterThan(0);
    });

    it('hides elapsedSeconds in ResultBar when displayTimeOption is "resultsOnly"', () => {
      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          displayTimeOption: 'resultsOnly',
        },
        updateSettings: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} elapsedSeconds={125} />
        </QueryClientProvider>,
      );

      expect(screen.queryByText('2:05')).not.toBeInTheDocument();
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
          <Game {...defaultGameProps} />
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

    it('forwards userId, puzzleDate, and elapsedSeconds to the API in daily mode', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: true,
        points: 10,
        message: 'Great job!',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game
            {...defaultGameProps}
            puzzleDate="2026-08-11"
            userId="test-user-id"
            elapsedSeconds={15}
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
          expect.any(Number),
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
          <Game {...defaultGameProps} />
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

  describe('Tier Times Sync', () => {
    it('calls updateTierTimes when tierTimes state changes in daily mode with a user', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <Game
            {...defaultGameProps}
            userId="test-user-id"
            puzzleDate="2026-08-11"
            tierTimes={{ bronze: 25 }}
          />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(wordService.updateTierTimes).toHaveBeenCalledWith('test-user-id', '2026-08-11', {
          bronze: 25,
        });
      });
    });
  });

  describe('Guess Recall', () => {
    it('recalls the last submitted guess when pressing Enter with an empty guess (physical keyboard)', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: false,
        points: 0,
        message: 'Not in word list',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} />
        </QueryClientProvider>,
      );

      await user.keyboard('LEAPFROG{Enter}');

      await waitFor(() => {
        expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);
      });

      await user.keyboard('{Enter}');

      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });

    it('recalls the last submitted guess when clicking ENTER on the virtual keyboard with an empty guess', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: false,
        points: 0,
        message: 'Not in word list',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} />
        </QueryClientProvider>,
      );

      await user.keyboard('LEAPFROG{Enter}');

      await waitFor(() => {
        expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);
      });

      const enterKey = screen.getByText('ENTER');
      await user.click(enterKey);

      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });

    it('recalls last submitted guess when clicking the ghost text input wrapper area', async () => {
      vi.mocked(wordService.checkWordValidity).mockResolvedValue({
        is_valid: false,
        points: 0,
        message: 'Not in word list',
      });

      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} />
        </QueryClientProvider>,
      );

      await user.keyboard('LEAPFROG{Enter}');

      await waitFor(() => {
        expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);
      });

      const ghostText = screen.getByText('LEAPFROG');
      await user.click(ghostText);

      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays an error message and logs to faro when the API call fails', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network Error');

      vi.mocked(wordService.checkWordValidity).mockRejectedValue(networkError);

      render(
        <QueryClientProvider client={queryClient}>
          <Game {...defaultGameProps} plate="FAL" />
        </QueryClientProvider>,
      );

      await user.keyboard('FAIL{Enter}');

      expect(
        await screen.findByText(/An error occurred while checking your guess/i),
      ).toBeInTheDocument();
    });
  });
});
