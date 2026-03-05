import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PuzzleDisplay from './PuzzleDisplay';
import { GameFeedback } from '@/types/game';

describe('PuzzleDisplay Component', () => {
  const defaultProps = {
    plate: 'LPG',
    guess: '',
    isSubmitting: false,
    feedback: null as GameFeedback | null,
    onGuessChange: vi.fn(),
    onGuessSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders', () => {
    it('renders the license plate letters', () => {
      render(<PuzzleDisplay {...defaultProps} />);
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });

    it('renders the virtual keyboard', () => {
      render(<PuzzleDisplay {...defaultProps} />);
      // Check for a few keys to ensure Keyboard is present
      expect(screen.getByText('Q')).toBeInTheDocument();
      expect(screen.getByText('O')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('ENTER')).toBeInTheDocument();
    });
  });

  describe('guess', () => {
    it('displays the current guess value', () => {
      render(<PuzzleDisplay {...defaultProps} guess="LEAPFROG" />);
      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });
  });

  describe('isSubmitting', () => {
    it('does not call callbacks when isSubmitting is true', () => {
      render(<PuzzleDisplay {...defaultProps} isSubmitting={true} />);

      fireEvent.keyDown(window, { key: 'a' });
      expect(defaultProps.onGuessChange).not.toHaveBeenCalled();
    });

    it('shows the spinner after a delay', () => {
      vi.useFakeTimers();
      render(<PuzzleDisplay {...defaultProps} isSubmitting={true} />);

      // Spinner should not be immediately visible
      const spinner = screen.queryByRole('progressbar');
      expect(spinner).not.toBeInTheDocument();

      // Fast-forward time by 300ms to trigger the spinner
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const delayedSpinner = screen.queryByRole('progressbar');
      expect(delayedSpinner).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('feedback', () => {
    it('shows feedback when the feedback object is provided', async () => {
      const successFeedback: GameFeedback = { message: 'Valid word!', type: 'success' };
      render(<PuzzleDisplay {...defaultProps} feedback={successFeedback} />);

      // findByText is useful here to handle the internal Fade animation of FeedbackDisplay
      expect(await screen.findByText('Valid word!')).toBeInTheDocument();
    });

    it('does not render feedback when the feedback object is null', () => {
      render(<PuzzleDisplay {...defaultProps} feedback={null} />);

      const feedbackText = screen.queryByText('Valid word!');
      expect(feedbackText).not.toBeInTheDocument();
    });
  });

  describe('onGuessChange', () => {
    describe('virtual keyboard', () => {
      it('calls onGuessChange when a letter key is clicked', () => {
        render(<PuzzleDisplay {...defaultProps} guess="ABC" />);
        const keyQ = screen.getByText('Q');

        fireEvent.click(keyQ);
        expect(defaultProps.onGuessChange).toHaveBeenCalledWith('ABCQ');
      });

      it('calls onGuessChange with sliced string when DELETE is clicked', () => {
        render(<PuzzleDisplay {...defaultProps} guess="WORD" />);

        const deleteKey = screen.getByTestId('keyboard-delete');
        fireEvent.click(deleteKey);

        expect(defaultProps.onGuessChange).toHaveBeenCalledWith('WOR');
      });
    });

    describe('physical keyboard', () => {
      it('calls onGuessChange when a physical key is pressed', () => {
        render(<PuzzleDisplay {...defaultProps} guess="A" />);
        fireEvent.keyDown(window, { key: 'b' });
        expect(defaultProps.onGuessChange).toHaveBeenCalledWith('AB');
      });
    });
  });

  describe('onGuessSubmit', () => {
    describe('virtual keyboard', () => {
      it('calls onGuessSubmit when ENTER key is clicked', () => {
        render(<PuzzleDisplay {...defaultProps} />);
        const enterKey = screen.getByText('ENTER');

        fireEvent.click(enterKey);
        expect(defaultProps.onGuessSubmit).toHaveBeenCalled();
      });
    });

    describe('physical keyboard', () => {
      it('calls onGuessSubmit when physical Enter is pressed', () => {
        render(<PuzzleDisplay {...defaultProps} />);

        fireEvent.keyDown(window, { key: 'Enter' });
        expect(defaultProps.onGuessSubmit).toHaveBeenCalled();
      });
    });
  });
});
