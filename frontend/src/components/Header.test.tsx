import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './Header';
import { useColorScheme } from '@components';
import { hasPracticeProgress, resetPracticeGame } from '@/utils/practiceRandomizer';

// Mock components and color scheme
vi.mock('@components', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useColorScheme: vi.fn(),
  };
});

// Mock randomize utility
vi.mock('@/utils/practiceRandomizer', () => ({
  hasPracticeProgress: vi.fn(),
  resetPracticeGame: vi.fn(),
}));

describe('Header Component', () => {
  const mockSetMode = vi.fn();
  const mockSetResultsOpen = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (useColorScheme as any).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
    });
  });

  const renderHeader = (
    initialRoute = '/',
    props = { resultsOpen: false, setResultsOpen: mockSetResultsOpen },
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Header {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  describe('Initial Render', () => {
    it('renders without crashing', () => {
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Logo Visibility', () => {
    it('renders the LPG logo on homepage', () => {
      renderHeader('/');
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });

    it('does NOT render the LPG logo on other pages', () => {
      renderHeader('/daily');
      expect(screen.queryByText('LPG')).not.toBeInTheDocument();
    });
  });

  describe('Navigation & Back Button', () => {
    it('does NOT render back button on the homepage', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('back to home')).not.toBeInTheDocument();
    });

    it('renders back button on non-home pages', () => {
      renderHeader('/daily');
      expect(screen.getByLabelText('back to home')).toBeInTheDocument();
    });
  });

  describe('Practice Plate Randomization', () => {
    it('does not render randomize button on non-practice pages', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('randomize plate')).not.toBeInTheDocument();
    });

    it('renders randomize button on the practice page', () => {
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

      expect(resetPracticeGame).not.toHaveBeenCalled();
      expect(screen.getByText('New Random Plate?')).toBeInTheDocument();
      expect(screen.getByText(/This will clear your current progress/i)).toBeInTheDocument();
    });

    it('calls resetPracticeGame when "Continue" is clicked in the dialog', async () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader('/practice');

      fireEvent.click(screen.getByLabelText('randomize plate'));

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      expect(resetPracticeGame).toHaveBeenCalledTimes(1);
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

  describe('Stats Modal Navigation', () => {
    it('does not render stats button on the homepage', () => {
      renderHeader('/');
      expect(screen.queryByLabelText('view stats')).not.toBeInTheDocument();
    });

    it('renders stats button on daily and practice pages', () => {
      const { unmount } = renderHeader('/daily');
      expect(screen.getByLabelText('view stats')).toBeInTheDocument();
      unmount();

      renderHeader('/practice');
      expect(screen.getByLabelText('view stats')).toBeInTheDocument();
    });

    it('triggers setResultsOpen when stats button is clicked', () => {
      renderHeader('/daily');
      fireEvent.click(screen.getByLabelText('view stats'));
      expect(mockSetResultsOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Tutorial Modal', () => {
    it('does not render the tutorial modal by default', () => {
      renderHeader('/');
      expect(
        screen.queryByText(/Find words that contain the three letters shown/i),
      ).not.toBeInTheDocument();
    });

    it('opens and closes the tutorial modal when interacting with help icon', () => {
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

    it('calls setMode with light mode when clicked from dark mode', () => {
      renderHeader('/');
      const themeToggleBtn = screen.getByLabelText('toggle theme');
      fireEvent.click(themeToggleBtn);
      expect(mockSetMode).toHaveBeenCalledWith('light');
    });

    it('calls setMode with dark mode when clicked from light mode', () => {
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
