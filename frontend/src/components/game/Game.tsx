import * as React from 'react';
import { checkWordValidity } from '@/api/wordService';
import PuzzleDisplay from './PuzzleDisplay';
import ResultDisplay from './ResultDisplay/ResultDisplay';
import MobileResultDisplay from './ResultDisplay/MobileResultDisplay';
import { Box, Grid, Fade } from '@components';
import { gameReducer, createInitialState } from './gameReducer';
import { GameMode } from '@/constants/game';

type Props = {
  plate: string;
  solutionsCount: Number;
  mode: GameMode;
};

function Game({ plate, solutionsCount, mode }: Props) {
  // TODO: Create "bar" for solutions count to show progress towards complete solve
  console.log('solutionsCount:', solutionsCount);
  const [state, dispatch] = React.useReducer(gameReducer, { mode }, () => createInitialState(mode));

  // Alert handling for displaying guess results
  const [showAlert, setShowAlert] = React.useState(false);

  React.useEffect(() => {
    if (!state.lastFeedback) return;
    // 1. Show the alert immediately
    setShowAlert(true);
    // 2. Schedule the hide
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 2000);
    // 3. Cleanup: If a NEW message comes in before 2s,
    return () => clearTimeout(timer);
  }, [state.lastFeedback]);

  const checkGuess = async () => {
    //setIsLoading(true);
    if (state.solutions.includes(state.guess)) {
      dispatch({ type: 'SET_FEEDBACK_MESSAGE', message: 'Already found!' });
      return;
    }
    try {
      const result = await checkWordValidity(state.guess, plate);
      if (result.is_valid) {
        dispatch({
          type: 'ADD_SOLUTION',
          guess: state.guess,
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
      //setIsLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: { md: 'none' } }}>
          <MobileResultDisplay solutions={state.solutions}></MobileResultDisplay>
        </Box>

        <Fade in={Boolean(showAlert)}>
          <Box sx={feedbackStyles}>{state.lastFeedback?.message}</Box>
        </Fade>
        <PuzzleDisplay
          plate={plate}
          guess={state.guess}
          onGuessChange={(val) => dispatch({ type: 'SET_GUESS', payload: val })}
          onGuessSubmit={checkGuess}
        />
      </Grid>
      <Grid size={{ md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
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
