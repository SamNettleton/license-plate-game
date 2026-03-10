import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import these
import Header from './Header';
import { useColorScheme } from '@components';
import { hasPracticeProgress, resetPracticeGame } from '@/utils/practiceRandomizer';

// Mock the components and the color scheme
vi.mock('@components', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useColorScheme: vi.fn(),
  };
});

// Mock the randomize utility
vi.mock('@/utils/practiceRandomizer', () => ({
  hasPracticeProgress: vi.fn(),
  resetPracticeGame: vi.fn(),
}));

describe('Header Component', () => {
  const mockSetMode = vi.fn();
  const queryClient = new QueryClient(); // Create a fresh client for tests

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    (useColorScheme as any).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
    });
  });

  const renderHeader = (initialRoute = '/') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Header />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  describe('render', () => {
    it('renders without crashing', () => {
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Logo', () => {
    it('renders the LPG logo on homepage', () => {
      renderHeader('/');
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });

    it('does NOT renders the LPG logo on other pages', () => {
      renderHeader('/game');
      expect(screen.queryByText('LPG')).not.toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('does NOT render on the homepage', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('back to home')).not.toBeInTheDocument();
    });

    it('renders on other pages', () => {
      renderHeader('/game');
      const backBtn = screen.getByLabelText('back to home');
      expect(backBtn).toBeInTheDocument();
    });
  });

  describe('Randomize Button and Confirmation', () => {
    it('does not render on non-practice pages', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('randomize plate')).not.toBeInTheDocument();
    });

    it('renders on the practice page', () => {
      renderHeader('/practice');
      expect(screen.getByLabelText('randomize plate')).toBeInTheDocument();
    });

    it('immediately calls resetPracticeGame if there is NO progress', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(false);
      renderHeader('/practice');

      fireEvent.click(screen.getByLabelText('randomize plate'));

      expect(resetPracticeGame).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens ConfirmationDialog if there IS progress', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader('/practice');

      fireEvent.click(screen.getByLabelText('randomize plate'));

      // Should NOT call reset yet
      expect(resetPracticeGame).not.toHaveBeenCalled();

      // Should show the dialog
      expect(screen.getByText('New Random Plate?')).toBeInTheDocument();
      expect(screen.getByText(/This will clear your current progress/i)).toBeInTheDocument();
    });

    it('calls resetPracticeGame when "Continue" is clicked in the dialog', async () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader('/practice');

      // Open dialog
      fireEvent.click(screen.getByLabelText('randomize plate'));

      // Click Continue button
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      expect(resetPracticeGame).toHaveBeenCalledTimes(1);

      // Wait for the animation to finish and the element to leave the DOM
      await waitForElementToBeRemoved(() => screen.queryByText('New Random Plate?'));
    });

    it('does not call resetPracticeGame if "Cancel" is clicked', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader('/practice');

      fireEvent.click(screen.getByLabelText('randomize plate'));

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(resetPracticeGame).not.toHaveBeenCalled();
    });
  });

  describe('Share Button', () => {
    it('does not render on the homepage', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('share results')).not.toBeInTheDocument();
    });

    it('renders on the daily page', () => {
      renderHeader('/daily');
      expect(screen.getByLabelText('share results')).toBeInTheDocument();
    });

    it('copies formatted results to clipboard when clicked', async () => {
      const testData = {
        points: 100,
        goalPoints: 100,
        plate: 'ABC',
      };
      queryClient.setQueryData(['active-game-results'], testData);

      renderHeader('/daily');

      const shareBtn = screen.getByLabelText('share results');
      fireEvent.click(shareBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
      expect(copiedText).toContain('100 pts');
      expect(copiedText).toContain('Full Throttle');
    });

    it('shows a toast notification after successful copy', async () => {
      queryClient.setQueryData(['active-game-results'], {
        points: 50,
        goalPoints: 100,
        plate: 'XYZ',
      });

      renderHeader('/daily');

      fireEvent.click(screen.getByLabelText('share results'));

      expect(
        await screen.findByText(/Results copied to clipboard/i, {}, { timeout: 3000 }),
      ).toBeInTheDocument();
    });
  });

  describe('Tutorial Modal', () => {
    it('does not render the tutorial modal by default', () => {
      renderHeader('/');
      expect(
        screen.queryByText(/Find words that contain the three letters shown/i),
      ).not.toBeInTheDocument();
    });

    it('opens the tutorial modal when clicking the help icon', () => {
      renderHeader('/');

      const helpBtn = screen.getByLabelText('how to play');
      fireEvent.click(helpBtn);

      expect(
        screen.getByText(/Find words that contain the three letters shown/i),
      ).toBeInTheDocument();

      const closeBtn = screen.getByText('Got it!');
      fireEvent.click(closeBtn);
    });
  });

  describe('Theme Toggle', () => {
    it('renders the theme toggle button', () => {
      renderHeader('/');
      expect(screen.getByLabelText('toggle theme')).toBeInTheDocument();
    });

    it('displays correct tooltip in dark mode', async () => {
      renderHeader('/');
      const themeToggleBtn = screen.getByLabelText('toggle theme');
      fireEvent.mouseOver(themeToggleBtn);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Switch to light mode');
    });

    it('displays correct tooltip in light mode', async () => {
      (useColorScheme as any).mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
      });
      renderHeader('/');
      const themeToggleBtn = screen.getByLabelText('toggle theme');
      fireEvent.mouseOver(themeToggleBtn);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Switch to dark mode');
    });

    it('calls setMode with the opposite mode when clicked from dark mode', () => {
      renderHeader('/');
      const themeToggleBtn = screen.getByLabelText('toggle theme');
      fireEvent.click(themeToggleBtn);
      expect(mockSetMode).toHaveBeenCalledWith('light');
    });

    it('calls setMode with the opposite mode when clicked from light mode', () => {
      (useColorScheme as any).mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
      });
      renderHeader('/');
      const themeToggleBtn = screen.getByLabelText('toggle theme');
      fireEvent.click(themeToggleBtn);
      expect(mockSetMode).toHaveBeenCalledWith('dark');
    });
  });
});
