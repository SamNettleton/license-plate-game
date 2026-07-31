import { GameMode, STORAGE_KEY, getTierForPoints, TIER_THRESHOLDS } from '@/constants/game';
import { GameFeedback } from '@/types/game';

export type GameState = {
  guess: string;
  solutions: string[];
  points: number;
  lastFeedback: GameFeedback | null;
  tierTimes: Record<string, number>;
  elapsedSeconds: number;
  timerRunning: boolean;
  mode: GameMode;
  activeTierLabel: string;
};

export type GameAction =
  | { type: 'SET_GUESS'; payload: string }
  | {
      type: 'ADD_SOLUTION';
      guess: string;
      feedback: string;
      points: number;
      mode: GameMode;
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
  mode: GameMode.PRACTICE,
  activeTierLabel: TIER_THRESHOLDS[0].label,
};

/**
 * Lazy Initializer for useReducer
 */
export function createInitialState(mode: GameMode, goalPoints: number = 0): GameState {
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

    const savedPoints = parsed.points || 0;
    const computedTier = getTierForPoints(savedPoints, goalPoints);

    return {
      ...initialState,
      solutions: parsed.solutions || [],
      points: savedPoints,
      tierTimes: parsed.tierTimes || {},
      elapsedSeconds: parsed.elapsedSeconds || 0,
      timerRunning: false,
      mode: mode,
      activeTierLabel: parsed.activeTierLabel || computedTier,
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
  tierTimes: Record<string, number>;
  elapsedSeconds: number;
  activeTierLabel: string;
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GUESS':
      return { ...state, guess: action.payload };

    case 'ADD_SOLUTION':
      const storageKey = STORAGE_KEY[action.mode];
      const updatedSolutions = [...state.solutions, action.guess].sort((a, b) =>
        a.localeCompare(b),
      );
      const updatedPoints = state.points + action.points;

      // Calculate new tier based on updated points
      const newTierLabel = getTierForPoints(updatedPoints, action.goalPoints);

      const currentTier = state.activeTierLabel;
      const updatedTierTimes = { ...state.tierTimes };

      if (newTierLabel !== currentTier) {
        updatedTierTimes[currentTier] = state.elapsedSeconds;
      }

      const progress: SavedProgress = {
        solutions: updatedSolutions,
        points: updatedPoints,
        lastUpdated: new Date().toLocaleDateString('en-CA'),
        tierTimes: updatedTierTimes,
        elapsedSeconds: state.elapsedSeconds,
        activeTierLabel: newTierLabel,
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (err) {
        /* ignore */
      }

      return {
        ...state,
        guess: '',
        solutions: updatedSolutions,
        points: updatedPoints,
        lastFeedback: { message: action.feedback, type: 'success' },
        tierTimes: updatedTierTimes,
        elapsedSeconds: state.elapsedSeconds,
        activeTierLabel: newTierLabel,
        timerRunning: state.timerRunning,
      };

    case 'START_TIMER': {
      if (state.timerRunning) return state;
      const newState = {
        ...state,
        timerRunning: true,
      };
      try {
        const storageKey = STORAGE_KEY[newState.mode];
        const progress: SavedProgress = {
          solutions: newState.solutions,
          points: newState.points,
          lastUpdated: new Date().toLocaleDateString('en-CA'),
          tierTimes: newState.tierTimes,
          elapsedSeconds: newState.elapsedSeconds,
          activeTierLabel: newState.activeTierLabel,
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (err) {}
      return newState;
    }

    case 'PAUSE_TIMER': {
      if (!state.timerRunning) return state;
      const paused = { ...state, timerRunning: false };
      try {
        const storageKey = STORAGE_KEY[paused.mode];
        const progress: SavedProgress = {
          solutions: paused.solutions,
          points: paused.points,
          lastUpdated: new Date().toLocaleDateString('en-CA'),
          tierTimes: paused.tierTimes,
          elapsedSeconds: paused.elapsedSeconds,
          activeTierLabel: paused.activeTierLabel,
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (err) {}
      return paused;
    }

    case 'TICK_TIMER':
      if (!state.timerRunning) return state;
      const ticked = { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
      try {
        const storageKey = STORAGE_KEY[ticked.mode];
        const progress: SavedProgress = {
          solutions: ticked.solutions,
          points: ticked.points,
          lastUpdated: new Date().toLocaleDateString('en-CA'),
          tierTimes: ticked.tierTimes,
          elapsedSeconds: ticked.elapsedSeconds,
          activeTierLabel: ticked.activeTierLabel,
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (err) {}
      return ticked;

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
