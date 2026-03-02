import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PuzzleDisplay from './PuzzleDisplay';

describe('PuzzleDisplay Component', () => {
  const defaultProps = {
    plate: 'LPG',
    guess: '',
    onGuessChange: vi.fn(),
    onGuessSubmit: vi.fn(),
  };

  it('renders the license plate letters', () => {
    render(<PuzzleDisplay {...defaultProps} />);
    expect(screen.getByText('LPG')).toBeInTheDocument();
  });

  it('renders the text input field', () => {
    render(<PuzzleDisplay {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter a solution');
    expect(input).toBeInTheDocument();
  });

  it('calls onGuessChange when the user types', () => {
    const onGuessChange = vi.fn();
    render(<PuzzleDisplay {...defaultProps} onGuessChange={onGuessChange} />);

    const input = screen.getByPlaceholderText('Enter a solution');
    fireEvent.change(input, { target: { value: 'leapfrog' } });

    expect(onGuessChange).toHaveBeenCalledWith('leapfrog');
  });

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

  it('displays the current guess value in the input', () => {
    render(<PuzzleDisplay {...defaultProps} guess="leapfrog" />);
    const input = screen.getByDisplayValue('leapfrog');
    expect(input).toBeInTheDocument();
  });
});
