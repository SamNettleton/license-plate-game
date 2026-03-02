import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  gameReducer,
  initialState,
  createInitialState,
  GameState,
} from './gameReducer';
import { GameMode } from '@/constants/game';

// We need to clear localStorage between tests to avoid state leakage
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('gameReducer', () => {
  it('SET_GUESS updates the guess field', () => {
    const action = { type: 'SET_GUESS' as const, payload: 'leapfrog' };
    const newState = gameReducer(initialState, action);
    expect(newState.guess).toBe('leapfrog');
  });

  it('ADD_SOLUTION prepends word, adds points, and clears the guess', () => {
    const state: GameState = { ...initialState, guess: 'leapfrog', points: 0, solutions: [] };
    const action = {
      type: 'ADD_SOLUTION' as const,
      guess: 'leapfrog',
      feedback: 'Nice one! +13',
      points: 13,
      mode: GameMode.PRACTICE,
    };
    const newState = gameReducer(state, action);

    expect(newState.solutions).toEqual(['leapfrog']);
    expect(newState.points).toBe(13);
    expect(newState.guess).toBe('');
    expect(newState.lastFeedback?.message).toBe('Nice one! +13');
  });

  it('ADD_SOLUTION with multiple words accumulates points correctly', () => {
    let state: GameState = { ...initialState };

    state = gameReducer(state, {
      type: 'ADD_SOLUTION',
      guess: 'limping',
      feedback: 'Nice one! +10',
      points: 10,
      mode: GameMode.PRACTICE,
    });
    state = gameReducer(state, {
      type: 'ADD_SOLUTION',
      guess: 'leapfrog',
      feedback: 'Nice one! +13',
      points: 13,
      mode: GameMode.PRACTICE,
    });

    // Most recent solution is first
    expect(state.solutions).toEqual(['leapfrog', 'limping']);
    expect(state.points).toBe(23);
  });

  it('RESET_GAME clears all fields', () => {
    const state: GameState = {
      guess: 'leapfrog',
      solutions: ['limping'],
      points: 10,
      lastFeedback: { message: 'hi', timestamp: Date.now() },
    };
    const newState = gameReducer(state, { type: 'RESET_GAME' });
    expect(newState).toEqual(initialState);
  });

  it('SET_FEEDBACK_MESSAGE sets the feedback and clears the guess', () => {
    const state: GameState = { ...initialState, guess: 'badword' };
    const newState = gameReducer(state, {
      type: 'SET_FEEDBACK_MESSAGE',
      message: 'Not in our dictionary!',
    });
    expect(newState.guess).toBe('');
    expect(newState.lastFeedback?.message).toBe('Not in our dictionary!');
  });
});

describe('createInitialState', () => {
  it('returns initialState when localStorage is empty', () => {
    const state = createInitialState(GameMode.PRACTICE);
    expect(state).toEqual(initialState);
  });

  it('restores saved solutions and points for practice mode', () => {
    localStorage.setItem(
      'lp_practice',
      JSON.stringify({ solutions: ['leapfrog'], points: 13, lastUpdated: '2024-01-01' })
    );
    const state = createInitialState(GameMode.PRACTICE);
    expect(state.solutions).toEqual(['leapfrog']);
    expect(state.points).toBe(13);
  });

  it('returns fresh state for daily mode when saved date is stale', () => {
    // Save a date from the distant past
    localStorage.setItem(
      'lp_daily',
      JSON.stringify({ solutions: ['oldword'], points: 5, lastUpdated: '2000-01-01' })
    );
    const state = createInitialState(GameMode.DAILY);
    // Should have cleared stale data and returned a fresh state
    expect(state).toEqual(initialState);
  });
});
