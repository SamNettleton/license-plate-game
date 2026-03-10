import { Box, LinearProgress, Stack, Typography } from '@components';
import { getMilestone } from '@/constants/game';

type Props = {
  points: number;
  goalPoints: number;
};

export default function ResultDisplay({ points, goalPoints }: Props) {
  const currentPercentage = (points / goalPoints) * 100;

  const { label, color } = getMilestone(currentPercentage);

  return (
    <Box sx={{ width: '90%', mx: 'auto', my: 2 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography
          variant="caption"
          color={color}
          sx={{ mt: 0.5, display: 'block', textAlign: 'center', fontWeight: 'bold' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {points} / {goalPoints} pts
        </Typography>
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
