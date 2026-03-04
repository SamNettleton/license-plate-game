import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Keyboard from './Keyboard';

describe('Keyboard Component', () => {
  const mockProps = {
    disabled: false,
    onChar: vi.fn(),
    onDelete: vi.fn(),
    onEnter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders', () => {
    it('renders all keys in the QWERTY layout', () => {
      render(<Keyboard {...mockProps} />);

      // Check for specific keys in each row
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
    it('calls onDelete when the DELETE icon button is clicked', () => {
      render(<Keyboard {...mockProps} />);

      const deleteKey = screen.getByTestId('keyboard-delete');
      fireEvent.click(deleteKey);

      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
