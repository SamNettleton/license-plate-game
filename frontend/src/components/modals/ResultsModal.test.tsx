import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResultsModal from './ResultsModal';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  tierTimes: {},
  points: 0,
  goalPoints: 100,
  plate: 'LPG',
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
      // 50% = Cruising tier — appears in both the summary and the tier list
      expect(screen.getAllByText('Cruising').length).toBeGreaterThan(0);
      expect(screen.getByText(/50 \/ 100 pts/)).toBeInTheDocument();
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
          tierTimes={{ Parked: 75 }} // 1 minute 15 seconds
          points={0}
          goalPoints={100}
        />,
      );

      // Primary split duration for Tier 1
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

    it('shows "0:00" for completed tiers with no recorded time', () => {
      renderWithClient(
        <ResultsModal {...defaultProps} points={50} goalPoints={100} tierTimes={{}} />,
      );
      // At 50% (Cruising), Parked, Good Start, and Gaining Speed are past tiers with 0 time
      const zeroTimes = screen.getAllByText('0:00');
      expect(zeroTimes.length).toBeGreaterThanOrEqual(2);
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
    it('renders when onShare is provided', () => {
      renderWithClient(<ResultsModal {...defaultProps} onShare={vi.fn()} />);
      expect(screen.getByText(/Share Results/i)).toBeInTheDocument();
    });

    it('calls onShare when clicked', () => {
      const onShare = vi.fn();
      renderWithClient(<ResultsModal {...defaultProps} onShare={onShare} />);
      fireEvent.click(screen.getByText(/Share Results/i));
      expect(onShare).toHaveBeenCalledOnce();
    });

    it('does not render when onShare is not provided', () => {
      renderWithClient(<ResultsModal {...defaultProps} />);
      expect(screen.queryByText(/Share Results/i)).not.toBeInTheDocument();
    });
  });
});
