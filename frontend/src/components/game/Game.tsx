import * as React from 'react';
import { checkWordValidity, updateTierTimes } from '@/api/wordService';
import PuzzleDisplay from './PuzzleDisplay';
import ResultDisplay from './ResultDisplay/ResultDisplay';
import MobileResultDisplay from './ResultDisplay/MobileResultDisplay';
import ResultBar from './ResultDisplay/ResultBar';
import ResultsModal from '@/components/modals/ResultsModal';
import { Box, Grid } from '@components';
import { gameReducer, createInitialState } from './gameReducer';
import { GameMode } from '@/constants/game';
import { faro } from '@/faro';
import { useSettings } from '@/context/SettingsContext';
import { useGameTimer, useCacheSync, useModalHistory } from '@/hooks/useGameHooks';

type Props = {
  plate: string;
  solutionsCount: number;
  goalPoints: number;
  wordsFound: string[];
  pointsEarned: number;
  elapsedSeconds: number;
  tierTimes: Record<string, number>;
  mode: GameMode;
  puzzleDate?: string;
  userId?: string;
};

function Game({
  plate,
  goalPoints,
  wordsFound,
  pointsEarned,
  elapsedSeconds,
  tierTimes,
  mode,
  puzzleDate,
  userId,
}: Props) {
  const [state, dispatch] = React.useReducer(
    gameReducer,
    { wordsFound, pointsEarned, elapsedSeconds, tierTimes },
    createInitialState,
  );

  const [showAlert, setShowAlert] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMobileResultsOpen, setIsMobileResultsOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { settings } = useSettings();
  const showInGameTimer = settings.displayTimeOption === 'gameAndResults';
  const showInResultsTimer = settings.displayTimeOption !== 'nowhere';

  React.useEffect(() => {
    // If server has more words than local state (e.g., added from Device 2)
    if (wordsFound.length > state.solutions.length) {
      const freshState = createInitialState({
        wordsFound,
        pointsEarned,
        // Preserve local timer if client is further ahead than server
        elapsedSeconds: Math.max(state.elapsedSeconds, elapsedSeconds),
        tierTimes,
      });

      dispatch({ type: 'LOAD_PUZZLE', payload: freshState });
    }
  }, [
    wordsFound,
    pointsEarned,
    elapsedSeconds,
    tierTimes,
    state.solutions.length,
    state.elapsedSeconds,
  ]);

  // Custom Hooks
  useGameTimer(isModalOpen, dispatch);
  useModalHistory(isModalOpen, () => setIsModalOpen(false));
  useCacheSync({
    elapsedSeconds: state.elapsedSeconds,
    goalPoints,
    plate,
    points: state.points,
    tierTimes: state.tierTimes,
    solutions: state.solutions,
    mode,
    puzzleDate,
    userId,
  });

  // Sync tier times to backend
  React.useEffect(() => {
    const isDaily = mode === GameMode.DAILY;
    const hasTiers = Object.keys(state.tierTimes).length > 0;

    if (!isDaily || !userId || !puzzleDate || !hasTiers) return;

    updateTierTimes(userId, puzzleDate, state.tierTimes).catch((err) => {
      if (faro) {
        faro.api.pushLog([`Failed to sync tier times: ${String(err)}`]);
      }
    });
  }, [state.tierTimes, userId, puzzleDate, mode]);

  // Feedback alert auto-hide
  React.useEffect(() => {
    if (!state.lastFeedback) return;
    setShowAlert(true);
    const timer = setTimeout(() => setShowAlert(false), 2000);
    return () => clearTimeout(timer);
  }, [state.lastFeedback]);

  const checkGuess = async () => {
    if (isSubmitting || !state.guess.trim()) return;
    setIsSubmitting(true);
    const lowercaseGuess = state.guess.toLowerCase();

    dispatch({ type: 'SAVE_LAST_SUBMITTED_GUESS', payload: state.guess });

    if (state.solutions.includes(lowercaseGuess)) {
      dispatch({ type: 'SET_FEEDBACK_MESSAGE', message: 'Already found!', feedbackType: 'info' });
      setIsSubmitting(false);
      return;
    }
    try {
      const isDaily = mode === GameMode.DAILY;
      const activePuzzleDate = isDaily ? puzzleDate : undefined;
      const activeUserId = isDaily ? userId : undefined;

      const result = await checkWordValidity(
        lowercaseGuess,
        plate,
        activeUserId,
        activePuzzleDate,
        state.elapsedSeconds,
      );

      if (result.is_valid) {
        dispatch({
          type: 'ADD_SOLUTION',
          guess: lowercaseGuess,
          feedback: result.message,
          points: result.points,
          goalPoints: goalPoints,
        });
      } else {
        dispatch({ type: 'SET_FEEDBACK_MESSAGE', message: result.message, feedbackType: 'info' });
      }
    } catch (err) {
      if (err instanceof Error && faro) {
        faro.api.pushError(err, {
          type: 'guess_verification_failure',
          context: {
            guess: state.guess.toLowerCase(),
            plate: plate,
            message: 'User saw the "An error occurred" feedback',
          },
        });
      } else if (faro) {
        faro.api.pushLog([`Non-standard error occurred: ${String(err)}`]);
      }

      dispatch({
        type: 'SET_FEEDBACK_MESSAGE',
        message: 'An error occurred while checking your guess.',
        feedbackType: 'error',
      });
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
          <ResultBar
            points={state.points}
            goalPoints={goalPoints}
            elapsedSeconds={showInGameTimer ? state.elapsedSeconds : undefined}
            onClick={() => setIsModalOpen(true)}
          />
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
            lastSubmittedGuess={state.lastSubmittedGuess}
            isSubmitting={isSubmitting}
            isModalOpen={isModalOpen}
            feedback={showAlert ? state.lastFeedback : null}
            onGuessChange={(val) => dispatch({ type: 'SET_GUESS', payload: val })}
            onGuessSubmit={checkGuess}
            onRecallLastGuess={() => dispatch({ type: 'RECALL_LAST_GUESS' })}
          />
        </Box>
      </Grid>
      <Grid size={{ md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
        <ResultBar
          points={state.points}
          goalPoints={goalPoints}
          elapsedSeconds={showInGameTimer ? state.elapsedSeconds : undefined}
          onClick={() => setIsModalOpen(true)}
        />
        <ResultDisplay solutions={state.solutions} />
      </Grid>
      <ResultsModal
        elapsedSeconds={state.elapsedSeconds}
        goalPoints={goalPoints}
        open={isModalOpen}
        plate={plate}
        points={state.points}
        showShareButton={mode === GameMode.DAILY}
        tierTimes={state.tierTimes}
        displayTimes={showInResultsTimer}
        onClose={() => setIsModalOpen(false)}
      />
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
