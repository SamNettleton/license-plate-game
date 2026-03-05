import { Box, CircularProgress, Fade, Typography } from '@components';
import * as React from 'react';
import Keyboard from '@/components/game/Keyboard';
import FeedbackDisplay from '@/components/game/ResultDisplay/FeedbackDisplay';
import { GameFeedback } from '@/types/game';

type Props = {
  plate: string;
  guess: string;
  isSubmitting: boolean;
  feedback: GameFeedback | null;
  onGuessChange: (val: string) => void;
  onGuessSubmit: () => void;
};

export default function PuzzleDisplay({
  plate,
  guess,
  isSubmitting,
  feedback,
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
      <Box sx={topSpacerStyles} />

      <Box sx={plateStyles}>{plate}</Box>

      <Box sx={bottomSpacerStyles} />

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

          <FeedbackDisplay feedback={feedback} />
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
  height: { xs: '100%', md: 'auto' },
  justifyContent: 'flex-start',
  pt: { xs: '2rem', md: '4rem' },
  gap: { xs: 0, md: 5 },
};

const topSpacerStyles = {
  flex: 0,
  '@media (max-width: 600px) and (min-height: 700px)': {
    height: 'auto',
    flex: 0.5,
    maxHeight: '80px',
  },
};

const bottomSpacerStyles = { flex: { xs: 1, md: 0 } };

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
  padding: { xs: '1rem 1.5rem 0.5rem 1.5rem', sm: '1.5rem 2.5rem 0.75rem 2.5rem' },
  '@media (max-width: 600px) and (min-height: 750px)': {
    fontSize: '5rem',
    padding: '1.5rem 2.5rem 0.75rem 2.5rem',
  },
  fontWeight: '900',
  borderRadius: 4,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
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
    '@media (max-width: 600px) and (min-height: 750px)': {
      border: '3px solid',
      top: '10px',
      left: '10px',
      right: '10px',
      bottom: '10px',
    },
    borderRadius: 3,
    pointerEvents: 'none',
    boxShadow: `
      0px 0px 2px 1px rgba(0, 0, 0, 0.3),
      inset 0px 0px 2px 1px rgba(0, 0, 0, 0.2),
      -1px -1px 1px rgba(255, 255, 255, 0.3),
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

const dockStyles = {
  marginTop: 'auto',
  position: { xs: 'relative', md: 'relative' },
  bottom: 0,
  width: '100%',
  maxWidth: { xs: '100%', md: '450px' },
  pb: {
    xs: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
    md: 2,
  },
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
