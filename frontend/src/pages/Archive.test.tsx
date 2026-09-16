import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Archive from './Archive';
import * as archiveService from '@/api/archiveService';
import { useSettings } from '@/context/SettingsContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/api/archiveService', () => ({
  fetchMonthlyArchive: vi.fn(),
}));

vi.mock('@/components/common/Calendar', () => ({
  Calendar: ({ onSelectDate }: { onSelectDate: (date: Date) => void }) => (
    <div data-testid="mock-calendar">
      <button onClick={() => onSelectDate(new Date('2026-05-15'))}>Select Date</button>
    </div>
  ),
}));

vi.mock('@/components/archive/ArchivePuzzleCard', () => ({
  default: ({ sequence, pointsEarned }: { sequence: string; pointsEarned: number }) => (
    <div data-testid="mock-archive-card">
      <span>Sequence: {sequence}</span>
      <span>Points: {pointsEarned}</span>
    </div>
  ),
}));

describe('Archive Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: { playerId: 'test-user-id' },
    });
    vi.mocked(archiveService.fetchMonthlyArchive).mockResolvedValue({
      userId: 'test-user-id',
      year: 2026,
      month: 5,
      summaries: [
        {
          date: '2026-05-15',
          sequence: 'XYZ789',
          goalPoints: 100,
          pointsEarned: 80,
          wordsFound: ['word1'],
          elapsedSeconds: 45,
          tierTimes: {},
        },
      ],
    });
  });

  describe('Initial Render & Data Fetching', () => {
    it('renders the archive title and fetches monthly data on mount', async () => {
      render(<Archive />);

      expect(screen.getByText('Puzzle Archive')).toBeInTheDocument();
      await waitFor(() => {
        expect(archiveService.fetchMonthlyArchive).toHaveBeenCalledWith(
          'test-user-id',
          expect.any(Number),
          expect.any(Number),
        );
      });
    });

    it('displays fallback message when no summary exists for the selected date', async () => {
      vi.mocked(archiveService.fetchMonthlyArchive).mockResolvedValue({
        userId: 'test-user-id',
        year: 2026,
        month: 5,
        summaries: [],
      });

      render(<Archive />);

      await waitFor(() => {
        expect(screen.getByText('No puzzle data available for this day.')).toBeInTheDocument();
      });
    });
  });

  describe('Interaction & Navigation', () => {
    it('navigates to daily puzzle view with correct date query when play button is clicked', async () => {
      const user = userEvent.setup();
      render(<Archive />);

      await waitFor(() => {
        expect(archiveService.fetchMonthlyArchive).toHaveBeenCalled();
      });

      const playButton = screen.getByRole('button', { name: /play puzzle/i });
      await user.click(playButton);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/daily/?date='));
    });
  });
});
