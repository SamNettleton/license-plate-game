import { Box, TextField, CircularProgress, Fade } from '@components';
import * as React from 'react';

type Props = {
  plate: string;
  guess: string;
  isSubmitting: boolean;
  onGuessChange: (val: string) => void;
  onGuessSubmit: () => void;
};

export default function PuzzleDisplay({
  plate,
  guess,
  isSubmitting,
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
        <TextField
          hiddenLabel
          fullWidth
          placeholder="Enter a solution"
          variant="standard"
          value={guess}
          disabled={isSubmitting}
          autoComplete="off"
          onChange={(e) => onGuessChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSubmitting) {
              onGuessSubmit();
            }
          }}
          sx={{
            '& .MuiInput-input': { textAlign: 'center', fontSize: '1.2rem' },
          }}
        />

        <Fade in={showSpinner}>
          <Box sx={spinnerStyles}>
            <CircularProgress size={24} />
          </Box>
        </Fade>
      </Box>

      <Box sx={plateStyles}>{plate}</Box>
    </Box>
  );
}

const plateStyles = {
  position: 'relative',
  width: 'fit-content',
  mx: 'auto',
  fontSize: '5rem',
  fontWeight: '900',
  borderRadius: 4,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  padding: '1.5rem 2.5rem 0.75rem 2.5rem',
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
