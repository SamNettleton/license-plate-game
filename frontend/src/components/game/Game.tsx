import * as React from 'react';
import { checkWordValidity } from '@/api/wordService';
import PuzzleDisplay from './PuzzleDisplay';
import ResultDisplay from './ResultDisplay/ResultDisplay';
import MobileResultDisplay from './ResultDisplay/MobileResultDisplay';
import ResultBar from './ResultDisplay/ResultBar';
import { Box, Grid } from '@components';
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
  const [isMobileResultsOpen, setIsMobileResultsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!state.lastFeedback) return;
    // Show the alert immediately
    setShowAlert(true);
    // Schedule the hide
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 2000);
    // Cleanup: If a NEW message comes in before 2s, reset the timer
    return () => clearTimeout(timer);
  }, [state.lastFeedback]);

  const checkGuess = async () => {
    if (isSubmitting) return;
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
    <Grid container spacing={2} sx={{ height: '100%' }}>
      <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: { md: 'none' },
            position: 'relative',
          }}
        >
          <ResultBar points={state.points} goalPoints={goalPoints}></ResultBar>
          <Box sx={{ position: 'relative', mt: 1 }}>
            <MobileResultDisplay
              solutions={state.solutions}
              onToggle={(isOpen) => setIsMobileResultsOpen(isOpen)}
            />
          </Box>
        </Box>

        <Box sx={puzzleDisplayStyles(isMobileResultsOpen)}>
          <PuzzleDisplay
            plate={plate}
            guess={state.guess}
            isSubmitting={isSubmitting}
            feedback={state.lastFeedback?.message}
            showFeedback={showAlert}
            onGuessChange={(val) => dispatch({ type: 'SET_GUESS', payload: val })}
            onGuessSubmit={checkGuess}
          />
        </Box>
      </Grid>
      <Grid size={{ md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
        <ResultBar points={state.points} goalPoints={goalPoints}></ResultBar>
        <ResultDisplay solutions={state.solutions}></ResultDisplay>
      </Grid>
    </Grid>
  );
}

const puzzleDisplayStyles = (isMobileResultsOpen: boolean) => ({
  position: 'relative',
  width: '100%',
  flex: { xs: 1, md: '0 1 auto' },
  display: isMobileResultsOpen ? { xs: 'none', md: 'flex' } : 'flex',
  flexDirection: 'column',
  mt: { md: 4 },
});

export default Game;
