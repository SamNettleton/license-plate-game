import { GameMode, STORAGE_KEY, getTierForPoints } from '@/constants/game';
import { GameFeedback } from '@/types/game';

export type GameState = {
  guess: string;
  solutions: string[];
  points: number;
  lastFeedback: GameFeedback | null;
  tierTimes: Record<string, number>;
  elapsedSeconds: number;
  timerRunning: boolean;
};

export type GameAction =
  | { type: 'SET_GUESS'; payload: string }
  | {
      type: 'ADD_SOLUTION';
      guess: string;
      feedback: string;
      points: number;
      goalPoints: number;
    }
  | { type: 'RESET_GAME' }
  | { type: 'SET_FEEDBACK_MESSAGE'; message: string; feedbackType: 'error' | 'info' }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'TICK_TIMER' };

export const initialState: GameState = {
  guess: '',
  solutions: [],
  points: 0,
  lastFeedback: null,
  tierTimes: {},
  elapsedSeconds: 0,
  timerRunning: false,
};

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
      tierTimes: parsed.tierTimes || {},
      elapsedSeconds: parsed.elapsedSeconds || 0,
      timerRunning: false,
    };
  } catch (error) {
    console.error('Malformed save data found:', error);
    return initialState;
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GUESS':
      return { ...state, guess: action.payload };

    case 'ADD_SOLUTION': {
      const updatedSolutions = [...state.solutions, action.guess].sort((a, b) =>
        a.localeCompare(b),
      );
      const updatedPoints = state.points + action.points;

      const currentTierLabel = getTierForPoints(state.points, action.goalPoints);
      const newTierLabel = getTierForPoints(updatedPoints, action.goalPoints);
      const updatedTierTimes = { ...state.tierTimes };

      if (newTierLabel !== currentTierLabel) {
        updatedTierTimes[currentTierLabel] = state.elapsedSeconds;
      }

      return {
        ...state,
        guess: '',
        solutions: updatedSolutions,
        points: updatedPoints,
        lastFeedback: { message: action.feedback, type: 'success' },
        tierTimes: updatedTierTimes,
      };
    }

    case 'START_TIMER':
      return state.timerRunning ? state : { ...state, timerRunning: true };

    case 'PAUSE_TIMER':
      return !state.timerRunning ? state : { ...state, timerRunning: false };

    case 'TICK_TIMER':
      return state.timerRunning ? { ...state, elapsedSeconds: state.elapsedSeconds + 1 } : state;

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
