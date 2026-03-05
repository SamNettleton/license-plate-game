import { Box, Fade, Typography, useTheme } from '@mui/material';
import { GameFeedback } from '@/types/game';

type Props = {
  feedback: GameFeedback | null;
};

export default function FeedbackDisplay({ feedback }: Props) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  if (!feedback) return null;

  const getColors = () => {
    const { type } = feedback;

    if (type === 'success') {
      // Success is always White background / Dark text
      return {
        bg: '#ffffff',
        text: theme.palette.common.black,
      };
    }

    if (type === 'info' || !type) {
      // Info: Darker Grey in Light Mode, Dark Grey in Dark Mode
      return {
        bg: isLight ? theme.palette.grey[900] : theme.palette.grey[800],
        text: '#ffffff',
      };
    }

    // Dull / Muted Red for errors
    return {
      bg: isLight ? '#c66b6b' : '#9e4a4a', // Slightly brighter for light mode, deeper for dark
      text: '#ffffff',
    };
  };

  const colors = getColors();

  return (
    <Fade in={Boolean(feedback)}>
      <Box sx={feedbackContainerStyles(colors)}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {feedback.message}
        </Typography>
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
  py: 0.75,
  borderRadius: 1,
  boxShadow: 3,
  whiteSpace: 'nowrap',
  backgroundColor: colors.bg,
  color: colors.text,
  transition: 'background-color 0.3s ease',
});
