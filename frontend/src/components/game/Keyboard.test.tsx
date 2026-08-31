import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Keyboard from './Keyboard';

describe('Keyboard Component', () => {
  const mockProps = {
    disabled: false,
    onChar: vi.fn(),
    onDelete: vi.fn(),
    onClear: vi.fn(),
    onEnter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renders', () => {
    it('renders all keys in the QWERTY layout', () => {
      render(<Keyboard {...mockProps} />);

      expect(screen.getByText('Q')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('Z')).toBeInTheDocument();
      expect(screen.getByText('ENTER')).toBeInTheDocument();
      expect(screen.getByTestId('keyboard-delete')).toBeInTheDocument();
    });
  });

  describe('disabled', () => {
    it('does not call any callbacks when disabled is true', () => {
      render(<Keyboard {...mockProps} disabled={true} />);

      const keyP = screen.getByText('P');
      const enterKey = screen.getByText('ENTER');
      const deleteKey = screen.getByTestId('keyboard-delete');

      fireEvent.click(keyP);
      fireEvent.click(enterKey);
      fireEvent.click(deleteKey);

      expect(mockProps.onChar).not.toHaveBeenCalled();
      expect(mockProps.onEnter).not.toHaveBeenCalled();
      expect(mockProps.onDelete).not.toHaveBeenCalled();
      expect(mockProps.onClear).not.toHaveBeenCalled();
    });
  });

  describe('onChar', () => {
    it('calls onChar when a character key is clicked', () => {
      render(<Keyboard {...mockProps} />);

      const keyW = screen.getByText('W');
      fireEvent.click(keyW);

      expect(mockProps.onChar).toHaveBeenCalledWith('W');
      expect(mockProps.onChar).toHaveBeenCalledTimes(1);
    });
  });

  describe('onEnter', () => {
    it('calls onEnter when the ENTER key is clicked', () => {
      render(<Keyboard {...mockProps} />);

      const enterKey = screen.getByText('ENTER');
      fireEvent.click(enterKey);

      expect(mockProps.onEnter).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDelete', () => {
    it('calls onDelete on a quick click', () => {
      render(<Keyboard {...mockProps} />);

      const deleteKey = screen.getByTestId('keyboard-delete');
      fireEvent.click(deleteKey);

      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
      expect(mockProps.onClear).not.toHaveBeenCalled();
    });
  });

  describe('onClear', () => {
    it('calls onClear after holding down DELETE for 500ms and suppresses onDelete', () => {
      render(<Keyboard {...mockProps} />);

      const deleteKey = screen.getByTestId('keyboard-delete');

      fireEvent.mouseDown(deleteKey);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockProps.onClear).toHaveBeenCalledTimes(1);

      fireEvent.mouseUp(deleteKey);
      fireEvent.click(deleteKey);

      expect(mockProps.onDelete).not.toHaveBeenCalled();
    });

    it('cancels onClear timer if mouse release happens before 500ms', () => {
      render(<Keyboard {...mockProps} />);

      const deleteKey = screen.getByTestId('keyboard-delete');

      fireEvent.mouseDown(deleteKey);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      fireEvent.mouseUp(deleteKey);
      fireEvent.click(deleteKey);

      expect(mockProps.onClear).not.toHaveBeenCalled();
      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('supports touch long press for onClear', () => {
      render(<Keyboard {...mockProps} />);

      const deleteKey = screen.getByTestId('keyboard-delete');

      fireEvent.touchStart(deleteKey);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockProps.onClear).toHaveBeenCalledTimes(1);

      fireEvent.touchEnd(deleteKey);
      fireEvent.click(deleteKey);

      expect(mockProps.onDelete).not.toHaveBeenCalled();
    });
  });
});
