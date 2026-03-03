import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PuzzleDisplay from './PuzzleDisplay';

describe('PuzzleDisplay Component', () => {
  const defaultProps = {
    plate: 'LPG',
    guess: '',
    isSubmitting: false,
    onGuessChange: vi.fn(),
    onGuessSubmit: vi.fn(),
  };

  describe('renders', () => {
    it('renders the text input field', () => {
      render(<PuzzleDisplay {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter a solution');
      expect(input).toBeInTheDocument();
    });
  });

  describe('plate', () => {
    it('renders the license plate letters', () => {
      render(<PuzzleDisplay {...defaultProps} />);
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });
  });

  describe('guess', () => {
    it('displays the current guess value in the input', () => {
      render(<PuzzleDisplay {...defaultProps} guess="leapfrog" />);
      const input = screen.getByDisplayValue('leapfrog');
      expect(input).toBeInTheDocument();
    });
  });

  describe('isSubmitting', () => {
    it('disables the input field when isSubmitting is true', () => {
      render(<PuzzleDisplay {...defaultProps} isSubmitting={true} />);
      const input = screen.getByPlaceholderText('Enter a solution');
      expect(input).toBeDisabled();
    });

    it('shows the spinner after a delay when isSubmitting becomes true', () => {
      // Tell Vitest to use fake timers
      vi.useFakeTimers();

      render(<PuzzleDisplay {...defaultProps} isSubmitting={true} />);
      const spinner = screen.queryByRole('progressbar'); // Assuming the spinner has role="progressbar"
      expect(spinner).not.toBeInTheDocument(); // Spinner should not be immediately visible

      // Fast-forward time by 300ms to trigger the spinner
      act(() => {
        vi.advanceTimersByTime(300);
      });

      const delayedSpinner = screen.queryByRole('progressbar');
      expect(delayedSpinner).toBeInTheDocument(); // Spinner should now be visible

      // Restore real timers so other tests aren't affected
      vi.useRealTimers();
    });
  });

  describe('onGuessChange', () => {
    it('calls onGuessChange when the user types', () => {
      const onGuessChange = vi.fn();
      render(<PuzzleDisplay {...defaultProps} onGuessChange={onGuessChange} />);

      const input = screen.getByPlaceholderText('Enter a solution');
      fireEvent.change(input, { target: { value: 'leapfrog' } });

      expect(onGuessChange).toHaveBeenCalledWith('leapfrog');
    });
  });

  describe('onGuessSubmit', () => {
    it('calls onGuessSubmit when Enter key is pressed', () => {
      const onGuessSubmit = vi.fn();
      render(<PuzzleDisplay {...defaultProps} onGuessSubmit={onGuessSubmit} />);

      const input = screen.getByPlaceholderText('Enter a solution');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onGuessSubmit).toHaveBeenCalledOnce();
    });

    it('does NOT call onGuessSubmit for non-Enter key presses', () => {
      const onGuessSubmit = vi.fn();
      render(<PuzzleDisplay {...defaultProps} onGuessSubmit={onGuessSubmit} />);

      const input = screen.getByPlaceholderText('Enter a solution');
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onGuessSubmit).not.toHaveBeenCalled();
    });
  });
});
