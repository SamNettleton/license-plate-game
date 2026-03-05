import { Box, Button, Typography } from '@components';

type Props = {
  error: Error | null;
  reset: () => void;
};

export default function ErrorDisplay({ error, reset }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
      }}
    >
      <Typography>{error?.message || 'Something went wrong'}</Typography>
      {reset && (
        <Button variant="contained" onClick={reset}>
          Try Again
        </Button>
      )}
    </Box>
  );
}
