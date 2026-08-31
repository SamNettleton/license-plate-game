import { Box, Typography } from '@components';
import * as React from 'react';
import Keyboard from '@/components/game/Keyboard';
import FeedbackDisplay from '@/components/game/ResultDisplay/FeedbackDisplay';
import { GameFeedback } from '@/types/game';

type Props = {
  plate: string;
  guess: string;
  lastSubmittedGuess?: string;
  isSubmitting: boolean;
  isModalOpen: boolean;
  feedback: GameFeedback | null;
  onGuessChange: (val: string) => void;
  onGuessSubmit: () => void;
  onRecallLastGuess?: () => void;
};

export default function PuzzleDisplay({
  plate,
  guess,
  lastSubmittedGuess,
  isSubmitting,
  isModalOpen,
  feedback,
  onGuessChange,
  onGuessSubmit,
  onRecallLastGuess,
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

  const canRecall = !guess && Boolean(lastSubmittedGuess);

  const handleInputClick = () => {
    if (canRecall && onRecallLastGuess) {
      onRecallLastGuess();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isModalOpen) return;

      if (e.target instanceof HTMLElement) {
        const targetTag = e.target.tagName.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
          return;
        }
      }

      const isLetter = e.key.length === 1 && e.key.match(/[a-z]/i);
      const isBackspace = e.key === 'Backspace';
      const isEnter = e.key === 'Enter';

      if (isLetter || isBackspace) {
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement !== document.body
        ) {
          document.activeElement.blur();
        }
      }
      if (isEnter) {
        const isFocusedOnButton = document.activeElement?.tagName === 'BUTTON';

        if (!isFocusedOnButton) {
          e.preventDefault();
          if (!guess && lastSubmittedGuess && onRecallLastGuess) {
            onRecallLastGuess();
          } else {
            onGuessSubmit();
          }
        }
      } else if (isBackspace) {
        onGuessChange(guess.slice(0, -1));
      } else if (isLetter) {
        onGuessChange(guess + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guess, isSubmitting, isModalOpen, onGuessChange, onGuessSubmit]);

  const handleChar = (char: string) => {
    onGuessChange(guess + char);
  };

  const handleDelete = () => {
    onGuessChange(guess.slice(0, -1));
  };

  const handleEnter = () => {
    if (!guess && lastSubmittedGuess && onRecallLastGuess) {
      onRecallLastGuess();
    } else {
      onGuessSubmit();
    }
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={topSpacerStyles} />

      <Box sx={plateStyles}>{plate}</Box>

      <Box sx={bottomSpacerStyles} />

      <Box sx={dockStyles}>
        <Box
          sx={{
            ...inputWrapperStyles,
            cursor: canRecall ? 'pointer' : 'default',
          }}
          onClick={handleInputClick}
        >
          <Typography variant="h4" sx={guessTypographyStyles}>
            {guess ? (
              guess
            ) : canRecall ? (
              <Box component="span" sx={{ opacity: 0.35, userSelect: 'none' }}>
                {lastSubmittedGuess?.toUpperCase()}
              </Box>
            ) : null}
            <Box component="span" sx={cursorStyles} />
          </Typography>

          <FeedbackDisplay feedback={feedback} showSpinner={showSpinner} />
        </Box>

        <Keyboard
          disabled={isSubmitting}
          onChar={handleChar}
          onDelete={handleDelete}
          onClear={() => onGuessChange('')}
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

  '@media (max-height: 600px)': {
    pt: '0.5rem',
    gap: '0.5rem',
  },
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

  '@media (max-height: 600px)': {
    height: '1.5rem',
    width: '1.5px',
  },
};

const plateStyles = {
  position: 'relative',
  width: 'fit-content',
  mx: 'auto',
  fontSize: { xs: '3.5rem', sm: '5rem' },
  padding: { xs: '0.75rem 1.25rem', sm: '1.5rem 2.5rem 0.75rem 2.5rem' },

  '@media (max-height: 600px)': {
    fontSize: '2.5rem',
    padding: '0.7rem 1.25rem 0.25rem 1.25rem',
    letterSpacing: '0.2rem',
    borderRadius: 2,
  },

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

  '&::after': {
    content: '""',
    position: 'absolute',
    top: '8px',
    left: '8px',
    right: '8px',
    bottom: '8px',
    border: '3px solid',
    '@media (max-height: 600px)': {
      top: '4px',
      left: '4px',
      right: '4px',
      bottom: '4px',
      border: '2px solid',
      borderRadius: 1,
    },
    '@media (max-width: 600px) and (min-height: 750px)': {
      border: '3px solid',
      top: '10px',
      left: '10px',
      right: '10px',
      bottom: '10px',
      borderRadius: 3,
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

  '@media (max-height: 600px)': {
    fontSize: '1.5rem',
    minHeight: '2rem',
    letterSpacing: 1,
  },
};
