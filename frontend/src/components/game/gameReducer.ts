import { GameMode, STORAGE_KEY } from '@/constants/game';
import { GameFeedback } from '@/types/game';

export type GameState = {
  guess: string;
  solutions: string[];
  points: number;
  lastFeedback: GameFeedback | null;
};

export type GameAction =
  | { type: 'SET_GUESS'; payload: string }
  | {
      type: 'ADD_SOLUTION';
      guess: string;
      feedback: string;
      points: number;
      mode: GameMode;
    }
  | { type: 'RESET_GAME' }
  | { type: 'SET_FEEDBACK_MESSAGE'; message: string; feedbackType: 'error' | 'info' };

export const initialState: GameState = {
  guess: '',
  solutions: [],
  points: 0,
  lastFeedback: null,
};

/**
 * Lazy Initializer for useReducer
 */
export function createInitialState(mode: GameMode): GameState {
  if (typeof window === 'undefined') return initialState;

  const storageKey = STORAGE_KEY[mode];
  const saved = localStorage.getItem(storageKey);

  if (!saved) return initialState;

  try {
    const parsed = JSON.parse(saved);

    if (mode === 'daily') {
      const today = new Date().toLocaleDateString('en-CA');
      if (parsed.lastUpdated !== today) {
        localStorage.removeItem(storageKey);
        return initialState;
      }
    }

    return {
      ...initialState,
      solutions: parsed.solutions || [],
      points: parsed.points || 0,
    };
  } catch (error) {
    console.error('Malformed save data found:', error);
    return initialState;
  }
}

type SavedProgress = {
  solutions: string[];
  points: number;
  lastUpdated: string; // Storing as YYYY-MM-DD
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GUESS':
      return { ...state, guess: action.payload };
    case 'ADD_SOLUTION':
      const storageKey = STORAGE_KEY[action.mode];
      const updatedSolutions = [action.guess, ...state.solutions];
      const updatedPoints = state.points + action.points;

      const progress: SavedProgress = {
        solutions: updatedSolutions,
        points: updatedPoints,
        lastUpdated: new Date().toLocaleDateString('en-CA'),
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));

      return {
        ...state,
        guess: '',
        solutions: updatedSolutions,
        points: updatedPoints,
        lastFeedback: { message: action.feedback, type: 'success' },
      };
    case 'RESET_GAME':
      return initialState;
    case 'SET_FEEDBACK_MESSAGE':
      return {
        ...state,
        guess: '',
        lastFeedback: { message: action.message, type: action.feedbackType },
      };
    default:
      return state;
  }
}
