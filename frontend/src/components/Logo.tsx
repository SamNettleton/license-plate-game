import { Box, Typography } from '@components';

export default function Logo() {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: 1.5,
        border: '2px solid',
        borderColor: 'primary.main',
        bgcolor: 'background.paper',
        transition: 'transform 0.2s',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 900,
          letterSpacing: 2,
          lineHeight: 1,
          color: 'primary.main',
          fontFamily: 'monospace',
        }}
      >
        LPG
      </Typography>
    </Box>
  );
}
