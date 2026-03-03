import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HowToPlayModal from './HowToPlayModal';

describe('HowToPlayModal Component', () => {
  it('renders nothing visible when open is false', () => {
    render(<HowToPlayModal open={false} onClose={vi.fn()} />);
    // The title should not appear in the document when the modal is closed
    expect(screen.queryByText('How to Play')).not.toBeInTheDocument();
  });

  it('renders the modal content when open is true', () => {
    render(<HowToPlayModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText(/Find words that contain the three letters/i)).toBeInTheDocument();
    expect(screen.getByText('Scoring')).toBeInTheDocument();
    expect(screen.getByText(/Longer words earn more points/i)).toBeInTheDocument();
  });

  it('renders the example plate and correct/incorrect words', () => {
    render(<HowToPlayModal open={true} onClose={vi.fn()} />);

    // The "L P G" example plate heading
    expect(screen.getByText('LPG')).toBeInTheDocument();
    // The incorrect example
    expect(screen.getByText(/Goalpost/i)).toBeInTheDocument();
  });

  it('calls onClose when the "Got it!" button is clicked', () => {
    const onClose = vi.fn();
    render(<HowToPlayModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Got it!'));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
