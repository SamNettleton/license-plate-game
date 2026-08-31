import * as React from 'react';
import { checkWordValidity } from '@/api/wordService';
import PuzzleDisplay from './PuzzleDisplay';
import ResultDisplay from './ResultDisplay/ResultDisplay';
import MobileResultDisplay from './ResultDisplay/MobileResultDisplay';
import ResultBar from './ResultDisplay/ResultBar';
import ResultsModal from '@/components/modals/ResultsModal';
import { Box, Grid } from '@components';
import { gameReducer, createInitialState } from './gameReducer';
import { GameMode, STORAGE_KEY } from '@/constants/game';
import { useQueryClient } from '@tanstack/react-query';
import { faro } from '@/faro';
import { useSettings } from '@/context/SettingsContext';

type SavedProgress = {
  solutions: string[];
  points: number;
  lastUpdated: string; // Storing as YYYY-MM-DD
  tierTimes: Record<string, number>;
  elapsedSeconds: number;
};

type Props = {
  plate: string;
  solutionsCount: number;
  goalPoints: number;
  mode: GameMode;
  puzzleDate?: string; // Optional, only for daily mode
  userId?: string; // Optional, only for daily mode
};

function Game({ plate, goalPoints, mode, puzzleDate, userId }: Props) {
  const queryClient = useQueryClient();
  const [state, dispatch] = React.useReducer(gameReducer, mode, createInitialState);

  const [showAlert, setShowAlert] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMobileResultsOpen, setIsMobileResultsOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [visibility, setVisibility] = React.useState(() =>
    typeof document !== 'undefined' ? document.visibilityState : 'visible',
  );

  const { settings } = useSettings();
  const showInGameTimer = settings.displayTimeOption === 'gameAndResults';
  const showInResultsTimer = settings.displayTimeOption !== 'nowhere';

  React.useEffect(() => {
    queryClient.setQueryData(['active-game-tier-times'], {
      elapsedSeconds: state.elapsedSeconds,
      goalPoints,
      plate,
      points: state.points,
      tierTimes: state.tierTimes,
    });
  }, [state.tierTimes, state.points, state.elapsedSeconds, goalPoints, plate, queryClient]);

  React.useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['active-game-tier-times'] });
    };
  }, [queryClient]);

  React.useEffect(() => {
    const handleVisibility = () => setVisibility(document.visibilityState);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Pause game timer when modal is active or browser tab loses focus
  React.useEffect(() => {
    const isPaused = isModalOpen || visibility === 'hidden';

    if (isPaused) {
      dispatch({ type: 'PAUSE_TIMER' });
      return;
    }

    dispatch({ type: 'START_TIMER' });

    const tickInterval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      dispatch({ type: 'PAUSE_TIMER' });
    };
  }, [isModalOpen, visibility]);

  React.useEffect(() => {
    if (!state.lastFeedback) return;
    setShowAlert(true);
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.lastFeedback]);

  React.useEffect(() => {
    const storageKey = STORAGE_KEY[mode];
    const progress: SavedProgress = {
      solutions: state.solutions,
      points: state.points,
      lastUpdated: new Date().toLocaleDateString('en-CA'),
      tierTimes: state.tierTimes,
      elapsedSeconds: state.elapsedSeconds,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (err) {}
  }, [state.solutions, state.points, state.tierTimes, state.elapsedSeconds, mode]);

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

      // Use the fixed puzzleDate prop for daily mode, or null for practice
      const activePuzzleDate = isDaily ? puzzleDate : undefined;
      const activeUserId = isDaily ? userId : undefined;

      const result = await checkWordValidity(lowercaseGuess, plate, activeUserId, activePuzzleDate);

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

  React.useEffect(() => {
    if (!isModalOpen) return;

    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      setIsModalOpen(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isModalOpen]);

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
          ></ResultBar>
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
        ></ResultBar>
        <ResultDisplay solutions={state.solutions}></ResultDisplay>
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
