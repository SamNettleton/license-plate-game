import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { InitialEntry } from 'react-router';
import Header from './Header';
import { useColorScheme } from '@components';
import { hasPracticeProgress, resetPracticeGame } from '@/utils/practiceRandomizer';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useNavigate: () => mockNavigate,
  };
});

// Mock components and color scheme
vi.mock('@components', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, any>),
    useColorScheme: vi.fn(),
  };
});

// Mock SettingsModal component
vi.mock('@/components/modals/SettingsModal', () => ({
  default: vi.fn(() => <div data-testid="mock-settings-modal" />),
}));

// Mock randomize utility
vi.mock('@/utils/practiceRandomizer', () => ({
  hasPracticeProgress: vi.fn(),
  resetPracticeGame: vi.fn(),
}));

describe('Header Component', () => {
  const mockSetMode = vi.fn();
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

  const renderHeader = (initialEntries: InitialEntry[] = ['/']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Header />
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
      renderHeader(['/']);
      expect(screen.getByText('LPG')).toBeInTheDocument();
    });

    it('does NOT render the LPG logo on other pages', () => {
      renderHeader(['/daily']);
      expect(screen.queryByText('LPG')).not.toBeInTheDocument();
    });
  });

  describe('Navigation & Back Button', () => {
    it('does NOT render back button on the homepage', () => {
      renderHeader(['/']);
      expect(screen.queryByLabelText('back')).not.toBeInTheDocument();
    });

    it('renders back button on non-home pages', () => {
      renderHeader(['/daily']);
      expect(screen.getByLabelText('back')).toBeInTheDocument();
    });

    it('navigates to homepage when back button is clicked without previous state', () => {
      renderHeader(['/daily']);
      fireEvent.click(screen.getByLabelText('back'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates to origin in location state when back button is clicked', () => {
      renderHeader([{ pathname: '/leaderboard', state: { origin: '/daily' } }]);
      fireEvent.click(screen.getByLabelText('back'));
      expect(mockNavigate).toHaveBeenCalledWith('/daily');
    });
  });

  describe('Leaderboard Button', () => {
    it('renders leaderboard button on standard pages', () => {
      renderHeader(['/']);
      expect(screen.getByLabelText('leaderboard')).toBeInTheDocument();
    });

    it('does NOT render leaderboard button on the leaderboard page', () => {
      renderHeader(['/leaderboard']);
      expect(screen.queryByLabelText('leaderboard')).not.toBeInTheDocument();
    });

    it('navigates to leaderboard passing current pathname and search params in state when clicked', () => {
      renderHeader(['/daily?date=2026-08-21']);
      fireEvent.click(screen.getByLabelText('leaderboard'));
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/leaderboard',
          search: '?date=2026-08-21',
        },
        {
          state: { origin: '/daily' },
          replace: false,
        },
      );
    });

    it('replaces current entry when navigating to leaderboard from stats page', () => {
      renderHeader(['/stats']);
      fireEvent.click(screen.getByLabelText('leaderboard'));
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/leaderboard',
          search: '',
        },
        {
          state: { origin: '/stats' },
          replace: true,
        },
      );
    });
  });

  describe('Stats Button', () => {
    it('renders stats button on standard pages', () => {
      renderHeader(['/']);
      expect(screen.getByLabelText('view stats')).toBeInTheDocument();
    });

    it('does NOT render stats button on the stats page', () => {
      renderHeader(['/stats']);
      expect(screen.queryByLabelText('view stats')).not.toBeInTheDocument();
    });

    it('navigates to stats passing current pathname and search params in state when clicked', () => {
      renderHeader(['/daily?date=2026-08-21']);
      fireEvent.click(screen.getByLabelText('view stats'));
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/stats',
          search: '?date=2026-08-21',
        },
        {
          state: { origin: '/daily' },
          replace: false,
        },
      );
    });

    it('replaces current entry when navigating to stats from leaderboard page', () => {
      renderHeader(['/leaderboard']);
      fireEvent.click(screen.getByLabelText('view stats'));
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: '/stats',
          search: '',
        },
        {
          state: { origin: '/leaderboard' },
          replace: true,
        },
      );
    });
  });

  describe('Practice Plate Randomization', () => {
    it('does not render randomize button on non-practice pages', () => {
      renderHeader(['/']);
      expect(screen.queryByLabelText('randomize plate')).not.toBeInTheDocument();
    });

    it('renders randomize button on the practice page', () => {
      renderHeader(['/practice']);
      expect(screen.getByLabelText('randomize plate')).toBeInTheDocument();
    });

    it('immediately calls resetPracticeGame if there is NO progress', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(false);
      renderHeader(['/practice']);

      fireEvent.click(screen.getByLabelText('randomize plate'));

      expect(resetPracticeGame).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens ConfirmationDialog if there IS progress', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader(['/practice']);

      fireEvent.click(screen.getByLabelText('randomize plate'));

      expect(resetPracticeGame).not.toHaveBeenCalled();
      expect(screen.getByText('New Random Plate?')).toBeInTheDocument();
      expect(screen.getByText(/This will clear your current progress/i)).toBeInTheDocument();
    });

    it('calls resetPracticeGame when "Continue" is clicked in the dialog', async () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader(['/practice']);

      fireEvent.click(screen.getByLabelText('randomize plate'));

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      expect(resetPracticeGame).toHaveBeenCalledTimes(1);
      await waitForElementToBeRemoved(() => screen.queryByText('New Random Plate?'));
    });

    it('does not call resetPracticeGame if "Cancel" is clicked', () => {
      vi.mocked(hasPracticeProgress).mockReturnValue(true);
      renderHeader(['/practice']);

      fireEvent.click(screen.getByLabelText('randomize plate'));

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(resetPracticeGame).not.toHaveBeenCalled();
    });
  });

  describe('Tutorial Modal', () => {
    it('renders how to play button on standard pages', () => {
      renderHeader(['/']);
      expect(screen.getByLabelText('how to play')).toBeInTheDocument();
    });

    it('does NOT render how to play button on leaderboard or stats page', () => {
      const { unmount } = renderHeader(['/leaderboard']);
      expect(screen.queryByLabelText('how to play')).not.toBeInTheDocument();
      unmount();

      renderHeader(['/stats']);
      expect(screen.queryByLabelText('how to play')).not.toBeInTheDocument();
    });

    it('does not render the tutorial modal by default', () => {
      renderHeader(['/']);
      expect(
        screen.queryByText(/Find words that contain the three letters shown/i),
      ).not.toBeInTheDocument();
    });

    it('opens and closes the tutorial modal when interacting with help icon', () => {
      renderHeader(['/']);

      const helpBtn = screen.getByLabelText('how to play');
      fireEvent.click(helpBtn);

      expect(
        screen.getByText(/Find words that contain the three letters shown/i),
      ).toBeInTheDocument();

      const closeBtn = screen.getByText('Got it!');
      fireEvent.click(closeBtn);
    });
  });

  describe('Settings Button', () => {
    it('renders the settings button on all pages', () => {
      const { unmount } = renderHeader(['/']);
      expect(screen.getByLabelText('settings')).toBeInTheDocument();
      unmount();

      renderHeader(['/leaderboard']);
      expect(screen.getByLabelText('settings')).toBeInTheDocument();
    });

    it('displays settings tooltip', async () => {
      renderHeader(['/']);
      const settingsBtn = screen.getByLabelText('settings');
      fireEvent.mouseOver(settingsBtn);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Settings');
    });

    it('opens settings modal when clicked', () => {
      renderHeader(['/']);
      const settingsBtn = screen.getByLabelText('settings');
      fireEvent.click(settingsBtn);
      expect(screen.getByTestId('mock-settings-modal')).toBeInTheDocument();
    });
  });
});
