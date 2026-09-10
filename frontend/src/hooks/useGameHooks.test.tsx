import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useGameTimer, useCacheSync, useModalHistory } from './useGameHooks';
import { GameMode } from '@/constants/game';

describe('useGameHooks', () => {
  describe('useGameTimer', () => {
    const dispatch = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('starts timer and dispatches TICK_TIMER every second when unpaused', () => {
      renderHook(() => useGameTimer(false, dispatch));

      expect(dispatch).toHaveBeenCalledWith({ type: 'START_TIMER' });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(dispatch).toHaveBeenCalledWith({ type: 'TICK_TIMER' });
      expect(dispatch).toHaveBeenCalledTimes(4); // 1 START_TIMER + 3 TICK_TIMER
    });

    it('pauses timer when modal is open', () => {
      renderHook(() => useGameTimer(true, dispatch));

      expect(dispatch).toHaveBeenCalledWith({ type: 'PAUSE_TIMER' });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not tick while paused
      expect(dispatch).not.toHaveBeenCalledWith({ type: 'TICK_TIMER' });
    });

    it('pauses timer when tab visibility changes to hidden', () => {
      const { unmount } = renderHook(() => useGameTimer(false, dispatch));

      expect(dispatch).toHaveBeenCalledWith({ type: 'START_TIMER' });

      // Simulate tab blur / hide
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(dispatch).toHaveBeenCalledWith({ type: 'PAUSE_TIMER' });

      unmount();
    });
  });

  describe('useCacheSync', () => {
    let queryClient: QueryClient;

    const createWrapper = () => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };

    const defaultProps = {
      elapsedSeconds: 120,
      goalPoints: 100,
      plate: 'ABC123',
      points: 45,
      tierTimes: { Gold: 60 },
      solutions: ['cat', 'dog'],
      mode: GameMode.DAILY,
      puzzleDate: '2026-09-10',
      userId: 'user-123',
    };

    it('syncs active game tier times to query cache', () => {
      renderHook(() => useCacheSync(defaultProps), {
        wrapper: createWrapper(),
      });

      const activeCache = queryClient.getQueryData(['active-game-tier-times']);
      expect(activeCache).toEqual({
        elapsedSeconds: 120,
        goalPoints: 100,
        plate: 'ABC123',
        points: 45,
        tierTimes: { Gold: 60 },
      });
    });

    it('syncs daily plate query data when in daily mode', () => {
      const wrapper = createWrapper();

      // Seed initial cache state
      queryClient.setQueryData(['dailyPlate', '2026-09-10', 'user-123'], {
        sequence: 'ABC123',
        wordsFound: [],
        pointsEarned: 0,
        elapsedSeconds: 0,
        tierTimes: {},
      });

      renderHook(() => useCacheSync(defaultProps), { wrapper });

      const updatedDailyCache = queryClient.getQueryData(['dailyPlate', '2026-09-10', 'user-123']);

      expect(updatedDailyCache).toEqual({
        sequence: 'ABC123',
        wordsFound: ['cat', 'dog'],
        pointsEarned: 45,
        elapsedSeconds: 120,
        tierTimes: { Gold: 60 },
      });
    });

    it('cleans up active-game-tier-times queries on unmount', () => {
      const wrapper = createWrapper();
      const { unmount } = renderHook(() => useCacheSync(defaultProps), { wrapper });

      expect(queryClient.getQueryData(['active-game-tier-times'])).toBeDefined();

      unmount();

      expect(queryClient.getQueryData(['active-game-tier-times'])).toBeUndefined();
    });
  });

  describe('useModalHistory', () => {
    const onClose = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('pushes history state when modal opens', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      renderHook(() => useModalHistory(true, onClose));

      expect(pushStateSpy).toHaveBeenCalledWith({ modalOpen: true }, '');
    });

    it('triggers onClose when browser popstate fires', () => {
      renderHook(() => useModalHistory(true, onClose));

      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls history.back on unmount if modal history state is present', () => {
      const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

      // Simulate history state set by pushState
      Object.defineProperty(window.history, 'state', {
        configurable: true,
        value: { modalOpen: true },
      });

      const { unmount } = renderHook(() => useModalHistory(true, onClose));
      unmount();

      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
