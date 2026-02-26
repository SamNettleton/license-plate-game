import { GameMode, STORAGE_KEY } from '@/constants/game';

export type GameState = {
  guess: string;
  solutions: string[];
  points: number;
  lastFeedback: { message: string; timestamp: number } | null;
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
  | { type: 'SET_FEEDBACK_MESSAGE'; message: string };

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
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));

      return {
        ...state,
        guess: '',
        solutions: updatedSolutions,
        points: updatedPoints,
        lastFeedback: { message: action.feedback, timestamp: Date.now() },
      };
    case 'RESET_GAME':
      return initialState;
    case 'SET_FEEDBACK_MESSAGE':
      return {
        ...state,
        guess: '',
        lastFeedback: { message: action.message, timestamp: Date.now() },
      };
    default:
      return state;
  }
}
