import { Box, Typography, CircularProgress, Fade } from '@components';

type Props = {
  message?: string;
};

export default function LoadingDisplay({ message = 'Loading...' }: Props) {
  return (
    <Fade in={true} timeout={800}>
      <Box sx={loadingContainerStyles}>
        <CircularProgress color="primary" size={60} thickness={4} />
        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}

const loadingContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: 2,
};
