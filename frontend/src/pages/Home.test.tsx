import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Home from './Home';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/components/modals/HowToPlayModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="how-to-play-modal">How To Play Modal</div> : null,
}));

describe('Home Page', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

  describe('Layout & Initial Render', () => {
    it('renders the game title heading', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /license plate game/i })).toBeInTheDocument();
    });

    it('renders navigation buttons for game modes', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /daily challenge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /practice/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to /daily when Daily Challenge button is clicked', () => {
      renderComponent();

      const dailyButton = screen.getByRole('button', { name: /daily challenge/i });
      fireEvent.click(dailyButton);

      expect(mockNavigate).toHaveBeenCalledWith('/daily');
    });

    it('navigates to /practice when Practice button is clicked', () => {
      renderComponent();

      const practiceButton = screen.getByRole('button', { name: /practice/i });
      fireEvent.click(practiceButton);

      expect(mockNavigate).toHaveBeenCalledWith('/practice');
    });
  });

  describe('First-Time User Experience', () => {
    it('opens instructions automatically for first-time visitors', () => {
      renderComponent();

      expect(screen.getByTestId('how-to-play-modal')).toBeInTheDocument();
      expect(localStorage.getItem('lp_visited')).toBe('true');
    });

    it('does not open instructions automatically for returning visitors', () => {
      localStorage.setItem('lp_visited', 'true');

      renderComponent();

      expect(screen.queryByTestId('how-to-play-modal')).not.toBeInTheDocument();
    });
  });
});
