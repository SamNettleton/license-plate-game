import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultBar from './ResultBar';

describe('ResultBar Component', () => {
  const renderBar = (points: number, goalPoints: number, elapsedSeconds?: number) =>
    render(<ResultBar points={points} goalPoints={goalPoints} elapsedSeconds={elapsedSeconds} />);

  describe('Milestone Labels', () => {
    it('shows "Parked" at 0 points', () => {
      renderBar(0, 300);
      expect(screen.getByText('Parked')).toBeInTheDocument();
      expect(screen.getByText('0 / 300 pts')).toBeInTheDocument();
    });

    it('shows "Good Start" between 1% and 24%', () => {
      renderBar(30, 300); // 10%
      expect(screen.getByText('Good Start')).toBeInTheDocument();
    });

    it('shows "Gaining Speed" at 25%', () => {
      renderBar(75, 300); // 25%
      expect(screen.getByText('Gaining Speed')).toBeInTheDocument();
    });

    it('shows "Cruising" at 50%', () => {
      renderBar(150, 300); // 50%
      expect(screen.getByText('Cruising')).toBeInTheDocument();
    });

    it('shows "In the Fast Lane" at 75%', () => {
      renderBar(225, 300); // 75%
      expect(screen.getByText('In the Fast Lane')).toBeInTheDocument();
    });

    it('shows "High Performance" at 90%', () => {
      renderBar(270, 300); // 90%
      expect(screen.getByText('High Performance')).toBeInTheDocument();
    });

    it('shows "Full Throttle" at exactly 100%', () => {
      renderBar(300, 300); // 100%
      expect(screen.getByText('Full Throttle')).toBeInTheDocument();
    });

    it('shows "Supersonic" above 115%', () => {
      renderBar(360, 300); // 120%
      expect(screen.getByText('Supersonic')).toBeInTheDocument();
    });

    it('renders the points fraction correctly', () => {
      renderBar(120, 400);
      expect(screen.getByText('120 / 400 pts')).toBeInTheDocument();
    });
  });

  describe('Elapsed Time Display', () => {
    it('renders formatted elapsed time when elapsedSeconds is provided', () => {
      renderBar(100, 300, 125); // 2 minutes, 5 seconds
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('formats single-digit seconds with leading zero', () => {
      renderBar(100, 300, 63); // 1 minute, 3 seconds
      expect(screen.getByText('1:03')).toBeInTheDocument();
    });

    it('renders 0:00 when elapsedSeconds is 0', () => {
      renderBar(100, 300, 0);
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('does not render time display when elapsedSeconds is undefined', () => {
      renderBar(100, 300);
      expect(screen.queryByText(/\d+:\d{2}/)).not.toBeInTheDocument();
    });
  });

  describe('onClick', () => {
    it('calls onClick when clicked', () => {
      const mockOnClick = vi.fn();
      render(<ResultBar points={100} goalPoints={300} onClick={mockOnClick} />);

      const bar = screen.getByRole('button', { name: /view tier breakdown/i });
      fireEvent.click(bar);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});
