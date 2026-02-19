export type GameState = {
  guess: string;
  solutions: string[];
  points: number;
  lastFeedback: { message: string; timestamp: number } | null;
};

export type GameAction =
  | { type: 'SET_GUESS'; payload: string }
  | { type: 'ADD_SOLUTION'; payload: string; points: number }
  | { type: 'RESET_GAME' }
  | { type: 'SET_FEEDBACK_MESSAGE'; payload: string };

export const initialState: GameState = {
  guess: '',
  solutions: [],
  points: 0,
  lastFeedback: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GUESS':
      return { ...state, guess: action.payload };
    case 'ADD_SOLUTION':
      return {
        ...state,
        guess: '',
        solutions: [action.payload, ...state.solutions],
        points: state.points + action.points,
        lastFeedback: { message: `Correct! +${action.points}`, timestamp: Date.now() },
      };
    case 'RESET_GAME':
      return initialState;
    case 'SET_FEEDBACK_MESSAGE':
      return {
        ...state,
        guess: '',
        lastFeedback: { message: action.payload, timestamp: Date.now() },
      };
    default:
      return state;
  }
}
