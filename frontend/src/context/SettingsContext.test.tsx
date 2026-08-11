import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';
import { syncUser } from '@/api/userService';
import { useColorScheme } from '@components';

vi.mock('@/api/userService', () => ({
  syncUser: vi.fn().mockResolvedValue({ status: 'synced' }),
}));

vi.mock('@components', () => ({
  useColorScheme: vi.fn(),
}));

const SETTINGS_KEY = 'license_plate_game_settings';

// Test consumer component to interact with context state
function TestConsumer() {
  const { settings, updateSettings } = useSettings();
  return (
    <div>
      <span data-testid="player-id">{settings.playerId}</span>
      <span data-testid="display-name">{settings.displayName}</span>
      <span data-testid="is-dark">{settings.isDarkTheme.toString()}</span>
      <button
        onClick={() => updateSettings({ displayName: 'Updated Name' })}
        data-testid="update-name-btn"
      >
        Update Name
      </button>
      <button onClick={() => updateSettings({ isDarkTheme: false })} data-testid="toggle-theme-btn">
        Toggle Theme
      </button>
    </div>
  );
}

describe('SettingsContext', () => {
  const mockSetMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useColorScheme as ReturnType<typeof vi.fn>).mockReturnValue({
      setMode: mockSetMode,
    });
  });

  describe('useSettings hook guard', () => {
    it('throws an error when consumed outside of SettingsProvider', () => {
      // Suppress expected console error output during hook error throw test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useSettings())).toThrow(
        'useSettings must be used within a SettingsProvider',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('initialization and localStorage', () => {
    it('initializes with default settings and a new UUID when localStorage is empty', () => {
      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(screen.getByTestId('display-name')).toHaveTextContent('Anonymous Traveler');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
      expect(screen.getByTestId('player-id').textContent).not.toBe('');

      const savedStorage = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      expect(savedStorage.displayName).toBe('Anonymous Traveler');
      expect(savedStorage.isDarkTheme).toBe(true);
    });

    it('loads existing settings from localStorage if present', () => {
      const existingSettings = {
        playerId: 'existing-uuid-1234',
        displayName: 'Road Warrior',
        isDarkTheme: false,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(existingSettings));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(screen.getByTestId('player-id')).toHaveTextContent('existing-uuid-1234');
      expect(screen.getByTestId('display-name')).toHaveTextContent('Road Warrior');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    });

    it('recovers with fallback defaults if localStorage contains corrupted JSON', () => {
      localStorage.setItem(SETTINGS_KEY, 'invalid-json-data');

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(screen.getByTestId('display-name')).toHaveTextContent('Anonymous Traveler');
      expect(screen.getByTestId('player-id').textContent).not.toBe('');
    });
  });

  describe('initial backend synchronization', () => {
    it('calls syncUser on initial mount with loaded playerId and displayName', () => {
      const existingSettings = {
        playerId: 'mount-uuid-5678',
        displayName: 'Initial User',
        isDarkTheme: true,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(existingSettings));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(syncUser).toHaveBeenCalledOnce();
      expect(syncUser).toHaveBeenCalledWith('mount-uuid-5678', 'Initial User');
    });

    it('handles syncUser rejection on mount gracefully without crashing', () => {
      (syncUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network offline'));

      expect(() => {
        render(
          <SettingsProvider>
            <TestConsumer />
          </SettingsProvider>,
        );
      }).not.toThrow();

      expect(screen.getByTestId('display-name')).toHaveTextContent('Anonymous Traveler');
    });
  });

  describe('theme synchronization', () => {
    it('syncs initial dark theme setting to color scheme setMode', () => {
      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(mockSetMode).toHaveBeenCalledWith('dark');
    });

    it('updates color scheme setMode when dark mode is toggled', () => {
      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      fireEvent.click(screen.getByTestId('toggle-theme-btn'));

      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
      expect(mockSetMode).toHaveBeenCalledWith('light');
    });
  });

  describe('updateSettings', () => {
    it('updates state and persists changes to localStorage', () => {
      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      fireEvent.click(screen.getByTestId('update-name-btn'));

      expect(screen.getByTestId('display-name')).toHaveTextContent('Updated Name');
      const savedStorage = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      expect(savedStorage.displayName).toBe('Updated Name');
    });

    it('triggers syncUser when displayName changes', () => {
      const existingSettings = {
        playerId: 'sync-uuid-9999',
        displayName: 'Original Name',
        isDarkTheme: true,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(existingSettings));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      vi.clearAllMocks(); // Clear initial mount syncUser call

      fireEvent.click(screen.getByTestId('update-name-btn'));

      expect(syncUser).toHaveBeenCalledOnce();
      expect(syncUser).toHaveBeenCalledWith('sync-uuid-9999', 'Updated Name');
    });

    it('does not trigger syncUser when displayName remains unchanged during updates', () => {
      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      vi.clearAllMocks(); // Clear initial mount syncUser call

      // Toggle dark theme without changing display name
      fireEvent.click(screen.getByTestId('toggle-theme-btn'));

      expect(syncUser).not.toHaveBeenCalled();
    });

    it('handles syncUser rejection during updateSettings gracefully', () => {
      (syncUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Sync failed'));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('update-name-btn'));
      }).not.toThrow();

      expect(screen.getByTestId('display-name')).toHaveTextContent('Updated Name');
    });
  });
});
