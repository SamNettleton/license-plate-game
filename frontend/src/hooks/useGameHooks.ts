import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GameMode } from '@/constants/game';

// Game Timer & Tab Visibility
export function useGameTimer(isModalOpen: boolean, dispatch: React.Dispatch<any>) {
  const [visibility, setVisibility] = React.useState(() =>
    typeof document !== 'undefined' ? document.visibilityState : 'visible',
  );

  React.useEffect(() => {
    const handleVisibility = () => setVisibility(document.visibilityState);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  React.useEffect(() => {
    const isPaused = isModalOpen || visibility === 'hidden';

    if (isPaused) {
      dispatch({ type: 'PAUSE_TIMER' });
      return;
    }

    dispatch({ type: 'START_TIMER' });

    const tickInterval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      dispatch({ type: 'PAUSE_TIMER' });
    };
  }, [isModalOpen, visibility, dispatch]);
}

// Query Cache Synchronization
export function useCacheSync({
  elapsedSeconds,
  goalPoints,
  plate,
  points,
  tierTimes,
  solutions,
  mode,
  puzzleDate,
  userId,
}: {
  elapsedSeconds: number;
  goalPoints: number;
  plate: string;
  points: number;
  tierTimes: Record<string, number>;
  solutions: string[];
  mode: GameMode;
  puzzleDate?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  // Sync state to TanStack Query
  React.useEffect(() => {
    queryClient.setQueryData(['active-game-tier-times'], {
      elapsedSeconds,
      goalPoints,
      plate,
      points,
      tierTimes,
    });

    if (mode === GameMode.DAILY && puzzleDate && userId) {
      queryClient.setQueryData(['dailyPlate', puzzleDate, userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          wordsFound: solutions,
          pointsEarned: points,
          elapsedSeconds,
          tierTimes,
        };
      });
    }
  }, [
    elapsedSeconds,
    goalPoints,
    plate,
    points,
    tierTimes,
    solutions,
    mode,
    puzzleDate,
    userId,
    queryClient,
  ]);

  // Cleanup active tier times on unmount
  React.useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['active-game-tier-times'] });
    };
  }, [queryClient]);
}

// Modal History Navigation
export function useModalHistory(isOpen: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
