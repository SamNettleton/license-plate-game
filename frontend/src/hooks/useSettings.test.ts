import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSettings } from './useSettings';
import { useColorScheme } from '@components';

vi.mock('@components', () => ({
  useColorScheme: vi.fn(),
}));

describe('useSettings Hook', () => {
  const mockSetMode = vi.fn();
  const SETTINGS_KEY = 'license_plate_game_settings';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useColorScheme as ReturnType<typeof vi.fn>).mockReturnValue({
      setMode: mockSetMode,
    });
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization and localStorage', () => {
    it('initializes with default settings and generates a playerId when localStorage is empty', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual({
        playerId: 'mock-uuid-1234',
        displayName: 'Anonymous Traveler',
        isDarkTheme: true,
      });
    });

    it('loads valid existing settings from localStorage', () => {
      const savedSettings = {
        playerId: 'existing-id-5678',
        displayName: 'Road Warrior',
        isDarkTheme: false,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual(savedSettings);
    });

    it('generates a new playerId if saved localStorage data lacks one', () => {
      const incompleteSettings = {
        displayName: 'Custom Name',
        isDarkTheme: false,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(incompleteSettings));

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.playerId).toBe('mock-uuid-1234');
      expect(result.current.settings.displayName).toBe('Custom Name');
    });

    it('falls back to default settings if localStorage contains invalid JSON', () => {
      localStorage.setItem(SETTINGS_KEY, '{invalid-json:');

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual({
        playerId: 'mock-uuid-1234',
        displayName: 'Anonymous Traveler',
        isDarkTheme: true,
      });
    });
  });

  describe('updateSettings', () => {
    it('updates state and persists changes to localStorage when called', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ displayName: 'Speedy Driver', isDarkTheme: false });
      });

      expect(result.current.settings.displayName).toBe('Speedy Driver');
      expect(result.current.settings.isDarkTheme).toBe(false);

      const persisted = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      expect(persisted.displayName).toBe('Speedy Driver');
      expect(persisted.isDarkTheme).toBe(false);
    });
  });

  describe('theme synchronization', () => {
    it('syncs theme mode on initial render and on theme setting state changes', () => {
      const { result } = renderHook(() => useSettings());

      expect(mockSetMode).toHaveBeenCalledWith('dark');

      act(() => {
        result.current.updateSettings({ isDarkTheme: false });
      });

      expect(mockSetMode).toHaveBeenCalledWith('light');
    });

    it('handles missing setMode from useColorScheme gracefully without throwing', () => {
      (useColorScheme as ReturnType<typeof vi.fn>).mockReturnValue({
        setMode: undefined,
      });

      expect(() => renderHook(() => useSettings())).not.toThrow();
    });
  });
});
