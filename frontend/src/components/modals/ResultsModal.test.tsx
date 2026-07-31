import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Helper function to render component wrapped in React Query context
const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('ResultsModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByText('Parked')).toBeInTheDocument();
      expect(screen.getByText('Good Start')).toBeInTheDocument();
      expect(screen.getByText('Gaining Speed')).toBeInTheDocument();
      expect(screen.getByText('Cruising')).toBeInTheDocument();
      expect(screen.getByText('In the Fast Lane')).toBeInTheDocument();
      expect(screen.getByText('High Performance')).toBeInTheDocument();
      expect(screen.getByText('Full Throttle')).toBeInTheDocument();
      expect(screen.getByText('Supersonic')).toBeInTheDocument();
    });

    it('formats tier times correctly', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          tierTimes={{ Parked: 75 }} // 1 minute 15 seconds
          points={0}
          goalPoints={100}
        />,
      );
      expect(screen.getByText('1:15')).toBeInTheDocument();
    });

    it('displays formatted time deltas between tiers', () => {
      renderWithClient(
        <ResultsModal
          {...defaultProps}
          tierTimes={{
            Parked: 17,
            'Good Start': 40, // 40s total (delta +0:23)
          }}
          points={30} // Good Start tier active
          goalPoints={100}
        />,
      );

      expect(screen.getByText('0:40')).toBeInTheDocument();
      expect(screen.getByText('(+0:23)')).toBeInTheDocument();
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
