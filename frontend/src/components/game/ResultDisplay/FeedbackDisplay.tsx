import { Box, CircularProgress, Fade, Typography, useTheme } from '@components';
import { GameFeedback } from '@/types/game';

type Props = {
  feedback: GameFeedback | null;
  showSpinner: boolean;
};

export default function FeedbackDisplay({ feedback, showSpinner }: Props) {
  if (!feedback && !showSpinner) return null;

  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const getColors = () => {
    // If we are spinning, or if the feedback is "info", use the dark grey theme
    if (showSpinner || !feedback || feedback.type === 'info') {
      return {
        bg: isLight ? theme.palette.grey[900] : theme.palette.grey[800],
        text: '#ffffff',
      };
    }

    if (feedback.type === 'success') {
      return {
        bg: '#ffffff',
        text: theme.palette.common.black,
      };
    }

    // Dull / Muted Red for errors
    return {
      bg: isLight ? '#c66b6b' : '#9e4a4a',
      text: '#ffffff',
    };
  };

  const colors = getColors();

  return (
    <Fade in={Boolean(feedback || showSpinner)}>
      <Box sx={feedbackContainerStyles(colors)} data-testid="feedback-box">
        {showSpinner ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Thinking...
            </Typography>
            <CircularProgress size={16} color="inherit" thickness={6} />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {feedback?.message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

const feedbackContainerStyles = (colors: any) => ({
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  mb: 2,
  zIndex: 110,
  px: 2,
  pt: 0.8,
  pb: 0.5,
  borderRadius: 1,
  boxShadow: 3,
  whiteSpace: 'nowrap',
  backgroundColor: colors.bg,
  color: colors.text,
  transition: 'background-color 0.3s ease',
});
