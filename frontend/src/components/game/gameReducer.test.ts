import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { gameReducer, initialState, createInitialState, GameState } from './gameReducer';
import { GameMode, getTierForPoints, TIER_THRESHOLDS } from '@/constants/game';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('gameReducer', () => {
  describe('createInitialState', () => {
    it('returns initialState when localStorage is empty', () => {
      const state = createInitialState(GameMode.PRACTICE);
      expect(state).toEqual(initialState);
    });

    it('restores saved solutions and points for practice mode', () => {
      localStorage.setItem(
        'lp_practice',
        JSON.stringify({ solutions: ['leapfrog'], points: 13, lastUpdated: '2024-01-01' }),
      );
      const state = createInitialState(GameMode.PRACTICE);
      expect(state.solutions).toEqual(['leapfrog']);
      expect(state.points).toBe(13);
    });

    it('returns fresh state for daily mode when saved date is stale', () => {
      localStorage.setItem(
        'lp_daily',
        JSON.stringify({ solutions: ['oldword'], points: 5, lastUpdated: '2000-01-01' }),
      );
      const state = createInitialState(GameMode.DAILY);
      expect(state).toEqual(initialState);
    });
  });

  describe('actions', () => {
    describe('SET_GUESS', () => {
      it('updates the guess field', () => {
        const action = { type: 'SET_GUESS' as const, payload: 'leapfrog' };
        const newState = gameReducer(initialState, action);
        expect(newState.guess).toBe('leapfrog');
      });
    });

    describe('ADD_SOLUTION', () => {
      it('adds word, updates points, and clears the guess', () => {
        const state: GameState = {
          ...initialState,
          guess: 'leapfrog',
          points: 0,
          solutions: [],
          tierTimes: {},
        };
        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'leapfrog',
          feedback: 'Nice one! +13',
          points: 13,
          goalPoints: 100,
        };
        const newState = gameReducer(state, action);

        expect(newState.solutions).toEqual(['leapfrog']);
        expect(newState.points).toBe(13);
        expect(newState.guess).toBe('');
        expect(newState.lastFeedback?.message).toBe('Nice one! +13');
      });

      it('sets success feedback and clears the guess', () => {
        const state: GameState = {
          ...initialState,
          guess: 'leapfrog',
          points: 0,
          solutions: [],
          tierTimes: {},
        };
        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'leapfrog',
          feedback: 'Nice one! +13',
          points: 13,
          goalPoints: 100,
        };
        const newState = gameReducer(state, action);

        expect(newState.lastFeedback).toEqual({
          message: 'Nice one! +13',
          type: 'success',
        });
      });

      it('alphabetizes solutions and accumulates points correctly', () => {
        let state: GameState = { ...initialState };

        state = gameReducer(state, {
          type: 'ADD_SOLUTION',
          guess: 'limping',
          feedback: 'Nice one! +10',
          points: 10,
          goalPoints: 100,
        });

        state = gameReducer(state, {
          type: 'ADD_SOLUTION',
          guess: 'leapfrog',
          feedback: 'Nice one! +13',
          points: 13,
          goalPoints: 100,
        });

        expect(state.solutions).toEqual(['leapfrog', 'limping']);
        expect(state.points).toBe(23);
      });

      it('strictly enforces alphabetical sorting regardless of entry order', () => {
        const state: GameState = { ...initialState, solutions: ['banana', 'cherry'] };

        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'apple',
          feedback: 'Nice one! +5',
          points: 5,
          goalPoints: 100,
        };

        const newState = gameReducer(state, action);
        expect(newState.solutions).toEqual(['apple', 'banana', 'cherry']);
      });

      it('records completed tier timing when crossing a tier threshold', () => {
        const state: GameState = {
          ...initialState,
          points: 0, // Starts in the 'Parked' threshold
          elapsedSeconds: 45,
        };

        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'leapfrog',
          feedback: 'Great!',
          points: 15, // Crosses into 'Good Start' threshold (15 points / 100 goalPoints = 15%)
          goalPoints: 100,
        };

        const newState = gameReducer(state, action);

        // Previous tier ('Parked') should capture elapsed seconds at completion
        expect(newState.tierTimes[TIER_THRESHOLDS[0].label]).toBe(45);

        const newTierLabel = getTierForPoints(newState.points, action.goalPoints);
        expect(newTierLabel).toBe(TIER_THRESHOLDS[1].label);
      });
    });

    describe('START_TIMER', () => {
      it('sets timerRunning to true', () => {
        const newState = gameReducer(initialState, { type: 'START_TIMER' });
        expect(newState.timerRunning).toBe(true);
      });
    });

    describe('PAUSE_TIMER', () => {
      it('sets timerRunning to false', () => {
        const state = { ...initialState, timerRunning: true };
        const newState = gameReducer(state, { type: 'PAUSE_TIMER' });
        expect(newState.timerRunning).toBe(false);
      });
    });

    describe('TICK_TIMER', () => {
      it('increments elapsedSeconds when timer is running', () => {
        const state = { ...initialState, timerRunning: true, elapsedSeconds: 10 };
        const newState = gameReducer(state, { type: 'TICK_TIMER' });
        expect(newState.elapsedSeconds).toBe(11);
      });

      it('ignores tick when timer is paused', () => {
        const state = { ...initialState, timerRunning: false, elapsedSeconds: 10 };
        const newState = gameReducer(state, { type: 'TICK_TIMER' });
        expect(newState.elapsedSeconds).toBe(10);
      });

      it('does not mutate other state fields when ticking', () => {
        const state: GameState = {
          ...initialState,
          timerRunning: true,
          guess: 'test',
          points: 42,
          solutions: ['leapfrog'],
          elapsedSeconds: 5,
        };
        const newState = gameReducer(state, { type: 'TICK_TIMER' });
        expect(newState.guess).toBe('test');
        expect(newState.points).toBe(42);
        expect(newState.solutions).toEqual(['leapfrog']);
        expect(newState.elapsedSeconds).toBe(6);
      });
    });

    describe('RESET_GAME', () => {
      it('clears all fields back to initialState', () => {
        const state: GameState = {
          guess: 'leapfrog',
          solutions: ['limping'],
          points: 10,
          lastFeedback: { message: 'Success!', type: 'success' },
          tierTimes: { Parked: 5, 'Good Start': 12 },
          elapsedSeconds: 12,
          timerRunning: true,
        };
        const newState = gameReducer(state, { type: 'RESET_GAME' });
        expect(newState).toEqual(initialState);
      });
    });

    describe('SET_FEEDBACK_MESSAGE', () => {
      it('sets the feedback and clears the guess', () => {
        const state: GameState = { ...initialState, guess: 'badword' };
        const newState = gameReducer(state, {
          type: 'SET_FEEDBACK_MESSAGE',
          message: 'Not in our dictionary!',
          feedbackType: 'info',
        });
        expect(newState.guess).toBe('');
        expect(newState.lastFeedback?.message).toBe('Not in our dictionary!');
      });

      it('sets error or info feedback correctly', () => {
        const state: GameState = { ...initialState, guess: 'badword' };

        const errorState = gameReducer(state, {
          type: 'SET_FEEDBACK_MESSAGE',
          message: 'Not in dictionary',
          feedbackType: 'error',
        });
        expect(errorState.lastFeedback).toEqual({
          message: 'Not in dictionary',
          type: 'error',
        });

        const infoState = gameReducer(state, {
          type: 'SET_FEEDBACK_MESSAGE',
          message: 'Already found!',
          feedbackType: 'info',
        });
        expect(infoState.lastFeedback).toEqual({
          message: 'Already found!',
          type: 'info',
        });
      });
    });
  });
});
