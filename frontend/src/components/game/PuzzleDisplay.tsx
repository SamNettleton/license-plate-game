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
      timer = setTimeout(() => setShowSpinner(true), 300); // 300ms delay
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
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.7)', // Slight white wash in light mode
              zIndex: 2,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        </Fade>
      </Box>

      <Box sx={plateStyles}>{plate}</Box>
    </Box>
  );
}

const plateStyles = {
  width: 'fit-content',
  mx: 'auto',
  fontSize: '4rem',
  borderRadius: 4,
  border: '4px solid',
  borderColor: 'primary.main',
  color: 'theme.vars.palette.primary',
  padding: '1.5rem 4rem 1rem 4rem',
  letterSpacing: '0.5rem',
};
