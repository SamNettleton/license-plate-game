import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PuzzleDisplay from './PuzzleDisplay';
import { GameFeedback } from '@/types/game';

describe('PuzzleDisplay Component', () => {
  const defaultProps = {
    plate: 'LPG',
    guess: '',
    lastSubmittedGuess: '',
    isSubmitting: false,
    isModalOpen: false,
    feedback: null as GameFeedback | null,
    onGuessChange: vi.fn(),
    onGuessSubmit: vi.fn(),
    onRecallLastGuess: vi.fn(),
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
      expect(screen.getByText('Q')).toBeInTheDocument();
      expect(screen.getByText('O')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('ENTER')).toBeInTheDocument();
    });
  });

  describe('guess & ghost text', () => {
    it('displays the current guess value', () => {
      render(<PuzzleDisplay {...defaultProps} guess="LEAPFROG" />);
      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });

    it('renders ghost text for lastSubmittedGuess when guess is empty', () => {
      render(<PuzzleDisplay {...defaultProps} guess="" lastSubmittedGuess="LEAPFROG" />);
      expect(screen.getByText('LEAPFROG')).toBeInTheDocument();
    });

    it('calls onRecallLastGuess when clicking the ghost text input area', () => {
      render(<PuzzleDisplay {...defaultProps} guess="" lastSubmittedGuess="LEAPFROG" />);

      const ghostText = screen.getByText('LEAPFROG');
      fireEvent.click(ghostText);

      expect(defaultProps.onRecallLastGuess).toHaveBeenCalledTimes(1);
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

      const spinner = screen.queryByRole('progressbar');
      expect(spinner).not.toBeInTheDocument();

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

      it('calls onGuessChange with empty string when DELETE onClear fires', () => {
        vi.useFakeTimers();
        render(<PuzzleDisplay {...defaultProps} guess="WORD" />);

        const deleteKey = screen.getByTestId('keyboard-delete');
        fireEvent.mouseDown(deleteKey);

        act(() => {
          vi.advanceTimersByTime(500);
        });

        expect(defaultProps.onGuessChange).toHaveBeenCalledWith('');
        vi.useRealTimers();
      });
    });

    describe('physical keyboard', () => {
      it('calls onGuessChange when a physical key is pressed', () => {
        render(<PuzzleDisplay {...defaultProps} guess="A" />);
        fireEvent.keyDown(window, { key: 'b' });
        expect(defaultProps.onGuessChange).toHaveBeenCalledWith('AB');
      });

      it('does not process game input when a modal is open', () => {
        render(<PuzzleDisplay {...defaultProps} isModalOpen={true} guess="A" />);
        fireEvent.keyDown(window, { key: 'b' });
        expect(defaultProps.onGuessChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('onGuessSubmit and recall handling', () => {
    describe('virtual keyboard', () => {
      it('calls onGuessSubmit when ENTER is clicked with non-empty guess', () => {
        render(<PuzzleDisplay {...defaultProps} guess="LEAPFROG" />);
        const enterKey = screen.getByText('ENTER');

        fireEvent.click(enterKey);
        expect(defaultProps.onGuessSubmit).toHaveBeenCalledTimes(1);
        expect(defaultProps.onRecallLastGuess).not.toHaveBeenCalled();
      });

      it('calls onRecallLastGuess when ENTER is clicked with empty guess and existing lastSubmittedGuess', () => {
        render(<PuzzleDisplay {...defaultProps} guess="" lastSubmittedGuess="LEAPFROG" />);
        const enterKey = screen.getByText('ENTER');

        fireEvent.click(enterKey);
        expect(defaultProps.onRecallLastGuess).toHaveBeenCalledTimes(1);
        expect(defaultProps.onGuessSubmit).not.toHaveBeenCalled();
      });
    });

    describe('physical keyboard', () => {
      it('calls onGuessSubmit when Enter is pressed with active guess', () => {
        render(<PuzzleDisplay {...defaultProps} guess="LEAPFROG" />);

        document.body.focus();

        const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(defaultProps.onGuessSubmit).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('calls onRecallLastGuess when Enter is pressed with empty guess', () => {
        render(<PuzzleDisplay {...defaultProps} guess="" lastSubmittedGuess="LEAPFROG" />);

        document.body.focus();

        const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(defaultProps.onRecallLastGuess).toHaveBeenCalledTimes(1);
        expect(defaultProps.onGuessSubmit).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('does NOT call submission or recall when a button IS focused', () => {
        render(<PuzzleDisplay {...defaultProps} guess="LEAPFROG" />);

        const button = document.createElement('button');
        document.body.appendChild(button);
        button.focus();

        const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(defaultProps.onGuessSubmit).not.toHaveBeenCalled();
        expect(defaultProps.onRecallLastGuess).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(button);
      });
    });
  });

  describe('focus management', () => {
    it('blurs a focused button when a letter is typed', () => {
      render(<PuzzleDisplay {...defaultProps} />);

      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      expect(document.activeElement).toBe(button);

      fireEvent.keyDown(window, { key: 'a' });

      expect(document.activeElement).not.toBe(button);
      document.body.removeChild(button);
    });

    it('blurs a focused button when backspace is pressed', () => {
      render(<PuzzleDisplay {...defaultProps} />);

      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      fireEvent.keyDown(window, { key: 'Backspace' });

      expect(document.activeElement).not.toBe(button);
      document.body.removeChild(button);
    });
  });
});
