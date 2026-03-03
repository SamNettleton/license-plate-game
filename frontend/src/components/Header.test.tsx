import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

vi.mock('@components', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as Record<string, any>,
    useColorScheme: vi.fn(),
  };
});

import { useColorScheme } from '@components';

describe('Header Component', () => {
  const mockSetMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useColorScheme as any).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
    });
  });

  const renderHeader = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Header />
      </MemoryRouter>
    );
  };

  it('renders correctly on the homepage', () => {
    renderHeader('/');

    expect(screen.getByText('LPG')).toBeInTheDocument();

    expect(screen.queryByLabelText('back to home')).not.toBeInTheDocument();
  });

  it('renders the back button when NOT on the homepage', () => {
    renderHeader('/game');

    // Ensure the Logo is hidden
    expect(screen.queryByText('LPG')).not.toBeInTheDocument();

    // Ensure the back button appears
    const backBtn = screen.getByLabelText('back to home');
    expect(backBtn).toBeInTheDocument();
  });

  it('toggles the theme mode when clicking the theme icon', () => {
    renderHeader('/');

    const themeToggleBtn = screen.getByLabelText('toggle theme');
    expect(themeToggleBtn).toBeInTheDocument();
    fireEvent.click(themeToggleBtn);

    // Because the default mode mock is 'dark', we expect setMode('light') to be called
    expect(mockSetMode).toHaveBeenCalledWith('light');
  });

  it('opens the tutorial modal when clicking the help icon', () => {
    renderHeader('/');

    const helpBtn = screen.getByLabelText('how to play');
    fireEvent.click(helpBtn);

    expect(screen.getByText(/Find words that contain the three letters shown/i)).toBeInTheDocument();
    
    const closeBtn = screen.getByText('Got it!');
    fireEvent.click(closeBtn);
  });
});
