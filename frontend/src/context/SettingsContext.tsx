import * as React from 'react';
// @vitest-environment jsdom
import { useColorScheme } from '@components';
import { syncUser } from '@/api/userService';

export type UserSettings = {
  playerId: string;
  displayName: string;
  isDarkTheme: boolean;
};

type SettingsContextType = {
  settings: UserSettings;
  updateSettings: (partial: Partial<Omit<UserSettings, 'playerId'>>) => void;
};

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = 'license_plate_game_settings';

const DEFAULT_SETTINGS: UserSettings = {
  playerId: '',
  displayName: 'Anonymous Traveler',
  isDarkTheme: true,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { setMode } = useColorScheme();

  const [settings, setSettings] = React.useState<UserSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          playerId: parsed.playerId || crypto.randomUUID(),
        };
      } catch {}
    }
    return {
      ...DEFAULT_SETTINGS,
      playerId: crypto.randomUUID(),
    };
  });

  React.useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const initialSettingsRef = React.useRef(settings);
  React.useEffect(() => {
    const { playerId, displayName } = initialSettingsRef.current;
    if (!playerId) return;

    void syncUser(playerId, displayName).catch(() => {
      // Intentionally swallow sync failures; UI should continue working offline.
    });
  }, []);

  React.useEffect(() => {
    if (!setMode) return;
    setMode(settings.isDarkTheme ? 'dark' : 'light');
  }, [settings.isDarkTheme, setMode]);

  const updateSettings = (partial: Partial<Omit<UserSettings, 'playerId'>>) => {
    if (partial.displayName !== undefined && partial.displayName !== settings.displayName) {
      void syncUser(settings.playerId, partial.displayName).catch(() => {});
    }

    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
