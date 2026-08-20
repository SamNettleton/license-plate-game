import { Box, LinearProgress, Stack, Typography } from '@components';
import { ChevronRightIcon } from '@icons';
import { getMilestone } from '@/constants/game';

type Props = {
  points: number;
  goalPoints: number;
  onClick?: () => void;
};

export default function ResultDisplay({ points, goalPoints, onClick }: Props) {
  const currentPercentage = (points / goalPoints) * 100;
  const { label, color } = getMilestone(currentPercentage);

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="View tier breakdown and rules"
      sx={resultBarStyles}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" color={color} sx={{ fontWeight: 'bold' }}>
          {label}
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {points} / {goalPoints} pts
          </Typography>
          <ChevronRightIcon fontSize="small" color="action" sx={{ opacity: 0.6 }} />
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(currentPercentage, 100)}
        sx={linearProgressStyles(currentPercentage)}
      />
    </Box>
  );
}

const linearProgressStyles = (progress: number) => ({
  height: 12,
  borderRadius: 5,
  backgroundColor: 'grey.200',
  border: '1px solid',
  borderColor: 'divider',
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    transition: 'transform 0.4s linear',
    backgroundColor: progress >= 115 ? 'secondary.main' : 'primary.main',
  },
});

const resultBarStyles = {
  width: '90%',
  mx: 'auto',
  my: 2,
  p: 1.5,
  borderRadius: 2,
  cursor: 'pointer',
  borderWidth: { xs: 1, md: 2 },
  borderStyle: 'solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    bgcolor: 'action.hover',
    borderColor: 'primary.main',
    boxShadow: 1,
  },
  '&:active': {
    transform: 'scale(0.99)',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
};
