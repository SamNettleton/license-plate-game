import { useState, useEffect } from 'react';
import { useColorScheme } from '@components';

const SETTINGS_KEY = 'license_plate_game_settings';

export type UserSettings = {
  playerId: string;
  displayName: string;
  isDarkTheme: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  playerId: '',
  displayName: 'Anonymous Traveler',
  isDarkTheme: true,
};

export function useSettings() {
  const { setMode } = useColorScheme();

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          playerId: parsed.playerId || crypto.randomUUID(),
        };
      } catch {
        // Fallback on parse failure
      }
    }
    return {
      ...DEFAULT_SETTINGS,
      playerId: crypto.randomUUID(),
    };
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!setMode) return;
    setMode(settings.isDarkTheme ? 'dark' : 'light');
  }, [settings.isDarkTheme, setMode]);

  const updateSettings = (partial: Partial<Omit<UserSettings, 'playerId'>>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  return {
    settings,
    updateSettings,
  };
}
