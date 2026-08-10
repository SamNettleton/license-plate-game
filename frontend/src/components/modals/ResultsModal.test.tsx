import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResultsModal from './ResultsModal';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  elapsedSeconds: 0,
  tierTimes: {},
  points: 0,
  goalPoints: 100,
  plate: 'LPG',
  showShareButton: false,
};

// Instantiated outside the render wrapper to prevent unnecessary reinstantiation
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
  });

  describe('tier rows', () => {
    it('renders all 8 tiers', () => {
      renderWithClient(<ResultsModal {...defaultProps} />);

      const tierContainer = screen.getByTestId('tier-list');

      expect(within(tierContainer).getByText('Parked')).toBeInTheDocument();
      expect(within(tierContainer).getByText('Good Start')).toBeInTheDocument();
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
          elapsedSeconds={75} // 1 minute 15 seconds
          points={0}
          goalPoints={100}
        />,
      );

      // Primary split duration for Tier 0 (Parked)
      expect(screen.getByText('1:15')).toBeInTheDocument();
      // Total subtext should NOT appear for the first tier (index 0)
      expect(screen.queryByText(/Total 1:15/i)).not.toBeInTheDocument();
    });

    it('displays split durations and cumulative total times for subsequent tiers', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          tierTimes={{
            Parked: 17, // Tier 1 split: 0:17
            'Good Start': 40, // Cumulative: 0:40 -> Split duration: 0:23
          }}
          points={30} // Good Start tier active
          goalPoints={100}
        />,
      );

      // Tier 1 (Parked): split time 0:17
      expect(screen.getByText('0:17')).toBeInTheDocument();

      // Tier 2 (Good Start): split time (40s - 17s = 23s) -> "0:23"
      expect(screen.getByText('0:23')).toBeInTheDocument();

      // Tier 2 (Good Start): cumulative subtext -> "Total 0:40"
      expect(screen.getByText('Total 0:40')).toBeInTheDocument();
    });

    it('shows "—" for future tiers', () => {
      renderWithClient(<ResultsModal {...defaultProps} points={0} goalPoints={100} />);
      // At 0% (Parked), all tiers after Parked are future
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
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
      // Mock the clipboard API
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

      // Verify clipboard write occurred
      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('License Plate Game'),
      );

      // Verify feedback snackbar/toast renders
      expect(await screen.findByText(/results copied to clipboard/i)).toBeInTheDocument();
    });
  });
});
