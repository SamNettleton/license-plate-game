import * as React from 'react';
import { checkWordValidity } from '@/api/wordService';
import PuzzleDisplay from './PuzzleDisplay';
import ResultDisplay from './ResultDisplay/ResultDisplay';
import MobileResultDisplay from './ResultDisplay/MobileResultDisplay';
import ResultBar from './ResultDisplay/ResultBar';
import { Box, Grid, Fade } from '@components';
import { gameReducer, createInitialState } from './gameReducer';
import { GameMode } from '@/constants/game';

type Props = {
  plate: string;
  solutionsCount: number;
  goalPoints: number;
  mode: GameMode;
};

function Game({ plate, goalPoints, mode }: Props) {
  const [state, dispatch] = React.useReducer(gameReducer, { mode }, () => createInitialState(mode));

  // Alert handling for displaying guess results
  const [showAlert, setShowAlert] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!state.lastFeedback) return;
    // Show the alert immediately
    setShowAlert(true);
    // Schedule the hide
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 2000);
    // Cleanup: If a NEW message comes in before 2s,
    return () => clearTimeout(timer);
  }, [state.lastFeedback]);

  const checkGuess = async () => {
    if (isSubmitting) return; // prevent duplicate submissions
    setIsSubmitting(true);
    const lowercaseGuess = state.guess.toLowerCase();
    if (state.solutions.includes(lowercaseGuess)) {
      dispatch({ type: 'SET_FEEDBACK_MESSAGE', message: 'Already found!' });
      setIsSubmitting(false);
      return;
    }
    try {
      const result = await checkWordValidity(lowercaseGuess, plate);
      if (result.is_valid) {
        dispatch({
          type: 'ADD_SOLUTION',
          guess: lowercaseGuess,
          feedback: result.message,
          points: result.points,
          mode: mode,
        });
      } else {
        dispatch({ type: 'SET_FEEDBACK_MESSAGE', message: result.message });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: { md: 'none' }, position: 'relative' }}>
          <ResultBar points={state.points} goalPoints={goalPoints}></ResultBar>
          <MobileResultDisplay solutions={state.solutions}></MobileResultDisplay>
        </Box>

        <Fade in={Boolean(showAlert)}>
          <Box sx={feedbackStyles}>{state.lastFeedback?.message}</Box>
        </Fade>
        <PuzzleDisplay
          plate={plate}
          guess={state.guess}
          isSubmitting={isSubmitting}
          onGuessChange={(val) => dispatch({ type: 'SET_GUESS', payload: val })}
          onGuessSubmit={checkGuess}
        />
      </Grid>
      <Grid size={{ md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
        <ResultBar points={state.points} goalPoints={goalPoints}></ResultBar>
        <ResultDisplay solutions={state.solutions}></ResultDisplay>
      </Grid>
    </Grid>
  );
}

const feedbackStyles = {
  width: 'fit-content',
  margin: '0 auto',
  backgroundColor: (theme: any) =>
    theme.palette.mode === 'light'
      ? 'grey.900' // High contrast for light mode
      : 'grey.800', // Lighter than the background for dark mode
  color: '#fff', // Snackbars usually stay white-on-dark even in dark mode
  px: 2,
  py: 0.75,
  borderRadius: 1,
  fontSize: '0.875rem',
  fontWeight: 500,
  boxShadow: 3,
  whiteSpace: 'nowrap',
  marginBottom: '1rem',
};

export default Game;
