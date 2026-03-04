import { Box, CircularProgress, Fade, Typography } from '@components';
import * as React from 'react';
import Keyboard from '@/components/game/Keyboard';

type Props = {
  plate: string;
  guess: string;
  isSubmitting: boolean;
  feedback: string | undefined;
  showFeedback: boolean;
  onGuessChange: (val: string) => void;
  onGuessSubmit: () => void;
};

export default function PuzzleDisplay({
  plate,
  guess,
  isSubmitting,
  feedback,
  showFeedback,
  onGuessChange,
  onGuessSubmit,
}: Props) {
  const [showSpinner, setShowSpinner] = React.useState(false);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSubmitting) {
      timer = setTimeout(() => setShowSpinner(true), 300);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      if (e.key === 'Enter') {
        onGuessSubmit();
      } else if (e.key === 'Backspace') {
        onGuessChange(guess.slice(0, -1));
      } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        onGuessChange(guess + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guess, isSubmitting, onGuessChange, onGuessSubmit]);

  const handleChar = (char: string) => {
    onGuessChange(guess + char);
  };

  const handleDelete = () => {
    onGuessChange(guess.slice(0, -1));
  };

  const handleEnter = () => {
    onGuessSubmit();
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={plateStyles}>{plate}</Box>

      <Box sx={dockStyles}>
        <Box sx={inputWrapperStyles}>
          <Typography variant="h4" sx={guessTypographyStyles}>
            {guess}
            <Box component="span" sx={cursorStyles} />
          </Typography>

          <Fade in={showSpinner}>
            <Box sx={spinnerStyles}>
              <CircularProgress size={24} />
            </Box>
          </Fade>

          <Fade in={Boolean(showFeedback && feedback)}>
            <Box sx={feedbackStyles}>{feedback}</Box>
          </Fade>
        </Box>

        <Keyboard
          disabled={isSubmitting}
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
        />
      </Box>
    </Box>
  );
}

const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  gap: { xs: '1rem', md: '5rem' },
  pb: { xs: '320px', md: '2rem' },
  pt: { xs: '1rem', md: '2rem' },
};

const cursorStyles = {
  display: 'inline-block',
  width: '2px',
  height: '2rem',
  bgcolor: 'primary.main',
  ml: 0.5,
  verticalAlign: 'middle',
  animation: 'blink 1s step-end infinite',
  '@keyframes blink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0 },
  },
};

const plateStyles = {
  position: 'relative',
  width: 'fit-content',
  mx: 'auto',
  fontSize: { xs: '4rem', sm: '5rem' },
  fontWeight: '900',
  borderRadius: 4,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  padding: { xs: '1rem 1.5rem 0.5rem 1.5rem', sm: '1.5rem 2.5rem 0.75rem 2.5rem' },
  letterSpacing: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  textShadow: '0px 2px 2px rgba(0, 0, 0, 0.4), 0px -1px 1px rgba(255, 255, 255, 0.3)',
  boxShadow: `
    0px 0px 2px 1px rgba(0, 0, 0, 0.3), 
    0px 10px 20px rgba(0, 0, 0, 0.2), 
    inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
  `,

  // "Inner Stripe" overlay
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '8px',
    left: '8px',
    right: '8px',
    bottom: '8px',
    border: '3px solid',
    borderRadius: 3,
    pointerEvents: 'none',
    boxShadow: `
    /* All-around base shadow (Spread: 1px) */
    0px 0px 2px 1px rgba(0, 0, 0, 0.3),
    /* Inset all-around shadow (Spread: 1px) */
    inset 0px 0px 2px 1px rgba(0, 0, 0, 0.2),
    /* Directional highlight (Top-Left) */
    -1px -1px 1px rgba(255, 255, 255, 0.3),
    /* Directional inner highlight (Bottom-Right) */
    inset -1px -1px 1px rgba(255, 255, 255, 0.2)
  `,
  },
};

const spinnerStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'rgba(255, 255, 255, 0.7)',
  zIndex: 2,
  borderRadius: 1,
};

const feedbackStyles = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  mb: 2,
  zIndex: 110,
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

const dockStyles = {
  position: { xs: 'fixed', md: 'relative' },
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  width: '100%',
  maxWidth: { xs: '100%', md: '450px' },
  mx: 'auto',
  pb: {
    xs: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
    md: 1,
  },
  pt: 2,
  px: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const inputWrapperStyles = {
  position: 'relative',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  mb: 2,
};

const guessTypographyStyles = {
  fontWeight: 'bold',
  letterSpacing: 2,
  minHeight: '3rem',
  display: 'flex',
  alignItems: 'bottom',
  fontSize: '2rem',
};
