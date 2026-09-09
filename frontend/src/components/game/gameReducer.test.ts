import { describe, it, expect } from 'vitest';
import { gameReducer, initialState, createInitialState, GameState } from './gameReducer';
import { getTierForPoints } from '@/constants/game';

describe('gameReducer', () => {
  describe('createInitialState', () => {
    it('returns default initialState when called without arguments', () => {
      const state = createInitialState();
      expect(state).toEqual(initialState);
    });

    it('hydrates initial state from provided parameters and alphabetizes solutions', () => {
      const state = createInitialState({
        wordsFound: ['limping', 'leapfrog'],
        pointsEarned: 23,
        elapsedSeconds: 45,
        tierTimes: { Bronze: 12 },
      });

      expect(state.solutions).toEqual(['leapfrog', 'limping']);
      expect(state.points).toBe(23);
      expect(state.elapsedSeconds).toBe(45);
      expect(state.tierTimes).toEqual({ Bronze: 12 });
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

    describe('SAVE_LAST_SUBMITTED_GUESS', () => {
      it('stores the payload into lastSubmittedGuess without altering current guess', () => {
        const state: GameState = {
          ...initialState,
          guess: 'leapfrog',
          lastSubmittedGuess: '',
        };
        const action = { type: 'SAVE_LAST_SUBMITTED_GUESS' as const, payload: 'leapfrog' };
        const newState = gameReducer(state, action);

        expect(newState.lastSubmittedGuess).toBe('leapfrog');
        expect(newState.guess).toBe('leapfrog');
      });
    });

    describe('RECALL_LAST_GUESS', () => {
      it('populates guess with lastSubmittedGuess', () => {
        const state: GameState = {
          ...initialState,
          guess: '',
          lastSubmittedGuess: 'leapfrog',
        };
        const action = { type: 'RECALL_LAST_GUESS' as const };
        const newState = gameReducer(state, action);

        expect(newState.guess).toBe('leapfrog');
      });

      it('overwrites an active guess with lastSubmittedGuess', () => {
        const state: GameState = {
          ...initialState,
          guess: 'partial',
          lastSubmittedGuess: 'leapfrog',
        };
        const action = { type: 'RECALL_LAST_GUESS' as const };
        const newState = gameReducer(state, action);

        expect(newState.guess).toBe('leapfrog');
      });
    });

    describe('ADD_SOLUTION', () => {
      it('adds word, updates points, clears guess, and sets feedback', () => {
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

      it('records tier timing when crossing a tier threshold for the first time', () => {
        const state: GameState = {
          ...initialState,
          points: 0,
          elapsedSeconds: 45,
          tierTimes: {},
        };

        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'leapfrog',
          feedback: 'Great!',
          points: 25,
          goalPoints: 100,
        };

        const newState = gameReducer(state, action);
        const newTierLabel = getTierForPoints(25, 100);

        expect(newState.tierTimes[newTierLabel]).toBe(45);
      });

      it('does not overwrite existing tier completion time if the tier was previously reached', () => {
        const initialTierLabel = getTierForPoints(25, 100);

        const state: GameState = {
          ...initialState,
          points: 25,
          elapsedSeconds: 90,
          tierTimes: { [initialTierLabel]: 45 },
        };

        const action = {
          type: 'ADD_SOLUTION' as const,
          guess: 'limping',
          feedback: 'Nice!',
          points: 5,
          goalPoints: 100,
        };

        const newState = gameReducer(state, action);

        // Tier timestamp remains fixed at original completion time
        expect(newState.tierTimes[initialTierLabel]).toBe(45);
      });
    });

    describe('START_TIMER', () => {
      it('sets timerRunning to true', () => {
        const newState = gameReducer(initialState, { type: 'START_TIMER' });
        expect(newState.timerRunning).toBe(true);
      });

      it('does not mutate state if timer is already running', () => {
        const state = { ...initialState, timerRunning: true };
        const newState = gameReducer(state, { type: 'START_TIMER' });
        expect(newState).toBe(state);
      });
    });

    describe('PAUSE_TIMER', () => {
      it('sets timerRunning to false', () => {
        const state = { ...initialState, timerRunning: true };
        const newState = gameReducer(state, { type: 'PAUSE_TIMER' });
        expect(newState.timerRunning).toBe(false);
      });

      it('does not mutate state if timer is already paused', () => {
        const newState = gameReducer(initialState, { type: 'PAUSE_TIMER' });
        expect(newState).toBe(initialState);
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
          lastSubmittedGuess: 'leapfrog',
          solutions: ['limping'],
          points: 10,
          lastFeedback: { message: 'Success!', type: 'success' },
          tierTimes: { Bronze: 12 },
          elapsedSeconds: 12,
          timerRunning: true,
        };
        const newState = gameReducer(state, { type: 'RESET_GAME' });
        expect(newState).toEqual(initialState);
      });
    });

    describe('LOAD_PUZZLE', () => {
      it('replaces the current game state with the provided state payload', () => {
        const customState: GameState = {
          ...initialState,
          points: 50,
          solutions: ['leapfrog', 'limping'],
          elapsedSeconds: 120,
        };

        const newState = gameReducer(initialState, {
          type: 'LOAD_PUZZLE',
          payload: customState,
        });

        expect(newState).toEqual(customState);
      });
    });

    describe('SET_FEEDBACK_MESSAGE', () => {
      it('sets feedback and clears the current guess', () => {
        const state: GameState = { ...initialState, guess: 'badword' };
        const newState = gameReducer(state, {
          type: 'SET_FEEDBACK_MESSAGE',
          message: 'Not in our dictionary!',
          feedbackType: 'info',
        });

        expect(newState.guess).toBe('');
        expect(newState.lastFeedback).toEqual({
          message: 'Not in our dictionary!',
          type: 'info',
        });
      });

      it('handles error feedback types correctly', () => {
        const state: GameState = { ...initialState, guess: 'badword' };
        const newState = gameReducer(state, {
          type: 'SET_FEEDBACK_MESSAGE',
          message: 'An error occurred while checking your guess.',
          feedbackType: 'error',
        });

        expect(newState.lastFeedback).toEqual({
          message: 'An error occurred while checking your guess.',
          type: 'error',
        });
      });
    });
  });
});
