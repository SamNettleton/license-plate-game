import { getTierForPoints } from '@/constants/game';
import { GameFeedback } from '@/types/game';

export type GameState = {
  guess: string;
  lastSubmittedGuess: string;
  solutions: string[];
  points: number;
  lastFeedback: GameFeedback | null;
  tierTimes: Record<string, number>;
  elapsedSeconds: number;
  timerRunning: boolean;
};

export type GameAction =
  | { type: 'SET_GUESS'; payload: string }
  | { type: 'SAVE_LAST_SUBMITTED_GUESS'; payload: string }
  | { type: 'RECALL_LAST_GUESS' }
  | {
      type: 'ADD_SOLUTION';
      guess: string;
      feedback: string;
      points: number;
      goalPoints: number;
    }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_PUZZLE'; payload: GameState }
  | { type: 'SET_FEEDBACK_MESSAGE'; message: string; feedbackType: 'error' | 'info' }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'TICK_TIMER' };

export const initialState: GameState = {
  guess: '',
  lastSubmittedGuess: '',
  solutions: [],
  points: 0,
  lastFeedback: null,
  tierTimes: {},
  elapsedSeconds: 0,
  timerRunning: false,
};

type InitialStateArgs = {
  wordsFound?: string[];
  pointsEarned?: number;
  tierTimes?: Record<string, number>;
  elapsedSeconds?: number;
};

export function createInitialState({
  wordsFound = [],
  pointsEarned = 0,
  tierTimes = {},
  elapsedSeconds = 0,
}: InitialStateArgs = {}): GameState {
  const sortedSolutions = [...wordsFound].sort((a, b) => a.localeCompare(b));

  return {
    ...initialState,
    solutions: sortedSolutions,
    points: pointsEarned,
    elapsedSeconds,
    tierTimes,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GUESS':
      return { ...state, guess: action.payload };

    case 'SAVE_LAST_SUBMITTED_GUESS':
      return { ...state, lastSubmittedGuess: action.payload };

    case 'RECALL_LAST_GUESS':
      return { ...state, guess: state.lastSubmittedGuess };

    case 'ADD_SOLUTION': {
      const updatedSolutions = [...state.solutions, action.guess].sort((a, b) =>
        a.localeCompare(b),
      );
      const updatedPoints = state.points + action.points;

      const currentTierLabel = getTierForPoints(state.points, action.goalPoints);
      const newTierLabel = getTierForPoints(updatedPoints, action.goalPoints);
      const updatedTierTimes = { ...state.tierTimes };

      if (newTierLabel !== currentTierLabel && !updatedTierTimes[newTierLabel]) {
        updatedTierTimes[newTierLabel] = state.elapsedSeconds;
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

    case 'LOAD_PUZZLE':
      return action.payload;

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
