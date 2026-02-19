import { Box, TextField } from '@components';

type Props = {
  plate: string;
  guess: string;
  onGuessChange: (val: string) => void;
  onGuessSubmit: () => void;
};

export default function PuzzleDisplay({ plate, guess, onGuessChange, onGuessSubmit }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <TextField
        hiddenLabel
        placeholder="Enter a solution"
        id="standard-basic"
        variant="standard"
        value={guess}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onGuessChange(event.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onGuessSubmit();
          }
        }}
        sx={{}}
      />
      <Box sx={plateStyles}>{plate}</Box>
    </Box>
  );
}

const plateStyles = {
  width: 'fit-content',
  mx: 'auto',
  p: 2,
  fontSize: '4rem',
  borderRadius: 4,
  border: '4px solid',
  borderColor: 'primary.main',
  color: 'theme.vars.palette.primary',
  padding: '1.5rem 4rem 1rem 4rem',
};
