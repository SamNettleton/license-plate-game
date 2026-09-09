import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResultsModal from './ResultsModal';

vi.mock('@/utils/shareFormatter', () => ({
  formatGameStatsForSharing: vi.fn().mockReturnValue('License Plate Game 50/100'),
}));

// Valid baseline tierTimes to pass hasValidTierTimes check in default tests
const validTierTimes = {
  'Good Start': 17,
};

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  elapsedSeconds: 0,
  tierTimes: validTierTimes,
  points: 0,
  goalPoints: 100,
  plate: 'LPG',
  showShareButton: false,
  displayTimes: true,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('ResultsModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('visibility', () => {
    it('renders nothing visible when closed', () => {
      renderWithClient(<ResultsModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Results')).not.toBeInTheDocument();
    });

    it('renders the modal title and plate when open', () => {
      renderWithClient(<ResultsModal {...defaultProps} />);
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });
  });

  describe('summary section', () => {
    it('shows the current milestone label and points', () => {
      renderWithClient(<ResultsModal {...defaultProps} points={50} goalPoints={100} />);

      const progressContainer = screen.getByTestId('progress-summary');

      expect(within(progressContainer).getByText('Cruising')).toBeInTheDocument();
      expect(within(progressContainer).getByText(/50 \/ 100 pts/)).toBeInTheDocument();
    });

    it('renders total time when displayTimes is true and tierTimes are valid', () => {
      renderWithClient(<ResultsModal {...defaultProps} displayTimes={true} elapsedSeconds={125} />);

      const progressContainer = screen.getByTestId('progress-summary');
      expect(within(progressContainer).getByText(/Total time: 2:05/i)).toBeInTheDocument();
    });

    it('hides total time when displayTimes is false', () => {
      renderWithClient(
        <ResultsModal {...defaultProps} displayTimes={false} elapsedSeconds={125} />,
      );

      const progressContainer = screen.getByTestId('progress-summary');
      expect(within(progressContainer).queryByText(/Total time:/i)).not.toBeInTheDocument();
    });
  });

  describe('tier rows', () => {
    it('renders all tiers', () => {
      renderWithClient(<ResultsModal {...defaultProps} />);

      const tierContainer = screen.getByTestId('tier-list');

      expect(within(tierContainer).getByText('Parked')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Good Start')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Gaining Speed')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Cruising')).toBeInTheDocument();
      expect(within(tierContainer).getByText('In the Fast Lane')).toBeInTheDocument();
      expect(within(tierContainer).getByText('High Performance')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Full Throttle')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Supersonic')).toBeInTheDocument();
    });

    it('formats tier times correctly for the first tier without showing cumulative total subtext', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          displayTimes={true}
          elapsedSeconds={75}
          points={0}
          goalPoints={100}
        />,
      );

      expect(screen.getByText('1:15')).toBeInTheDocument();
      expect(screen.queryByText(/Total 1:15/i)).not.toBeInTheDocument();
    });

    it('displays split durations and cumulative total times for subsequent tiers when displayTimes is true', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          displayTimes={true}
          elapsedSeconds={40}
          tierTimes={{
            'Good Start': 17,
          }}
          points={2}
          goalPoints={100}
        />,
      );

      expect(screen.getByText('0:17')).toBeInTheDocument();
      expect(screen.getByText('0:23')).toBeInTheDocument();
      expect(screen.getByText('Total 0:40')).toBeInTheDocument();
    });

    it('hides all split and total times when displayTimes is false', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          displayTimes={false}
          tierTimes={{
            'Good Start': 17,
            'Gaining Speed': 40,
          }}
          points={25}
          goalPoints={100}
        />,
      );

      expect(screen.queryByText('0:17')).not.toBeInTheDocument();
      expect(screen.queryByText('0:23')).not.toBeInTheDocument();
      expect(screen.queryByText('Total 0:40')).not.toBeInTheDocument();
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });

    it('shows "—" for future tiers when displayTimes is true', () => {
      renderWithClient(
        <ResultsModal {...defaultProps} displayTimes={true} points={0} goalPoints={100} />,
      );

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe('legacy tierTimes handling (missing initial baseline tiers)', () => {
    it('shows total time but hides tier splits when tierTimes is missing baseline tiers', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          displayTimes={true}
          tierTimes={{
            Supersonic: 378,
            'Full Throttle': 327,
          }}
          elapsedSeconds={400}
        />,
      );

      const progressContainer = screen.getByTestId('progress-summary');
      // Total time is shown
      expect(within(progressContainer).getByText(/Total time: 6:40/i)).toBeInTheDocument();

      // Split column components/dashes are suppressed
      expect(screen.queryByText('—')).not.toBeInTheDocument();
      expect(screen.queryByText('Total 6:18')).not.toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when the X button is clicked', () => {
      const onClose = vi.fn();
      renderWithClient(<ResultsModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close results/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('share button', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders when showShareButton is true', () => {
      renderWithClient(<ResultsModal {...defaultProps} showShareButton={true} />);
      expect(screen.getByRole('button', { name: /share results/i })).toBeInTheDocument();
    });

    it('does not render when showShareButton is false', () => {
      renderWithClient(<ResultsModal {...defaultProps} showShareButton={false} />);
      expect(screen.queryByRole('button', { name: /share results/i })).not.toBeInTheDocument();
    });

    it('copies results to clipboard and shows success toast when clicked', async () => {
      renderWithClient(<ResultsModal {...defaultProps} showShareButton={true} />);

      const shareButton = screen.getByRole('button', { name: /share results/i });
      fireEvent.click(shareButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('License Plate Game 50/100');
      expect(await screen.findByText(/results copied to clipboard/i)).toBeInTheDocument();
    });
  });
});
