import { Box, LinearProgress, Stack, Typography } from '@components';

type Props = {
  points: number;
  goalPoints: number;
};

export default function ResultDisplay({ points, goalPoints }: Props) {
  const currentPercentage = (points / goalPoints) * 100;

  const getProgressMilestone = (percent: number) => {
    if (percent >= 115) return { label: 'Supersonic', color: 'success.main' };
    if (percent >= 100) return { label: 'Full Throttle', color: 'success.main' };
    if (percent >= 90) return { label: 'High Performance', color: 'info.main' };
    if (percent >= 75) return { label: 'In the Fast Lane', color: 'info.light' };
    if (percent >= 50) return { label: 'Cruising', color: 'primary.main' };
    if (percent >= 25) return { label: 'Gaining Speed', color: 'secondary.main' };
    if (percent > 0) return { label: 'Good Start', color: 'text.secondary' };
    return { label: 'Parked', color: 'text.disabled' };
  };

  const currentProgress = getProgressMilestone(currentPercentage);
  console.log('progress:', currentProgress);

  return (
    <Box sx={{ width: '90%', mx: 'auto', my: 2 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography
          variant="caption"
          color={currentProgress.color}
          sx={{ mt: 0.5, display: 'block', textAlign: 'center', fontWeight: 'bold' }}
        >
          {currentProgress.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {points} / {goalPoints} pts
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(currentPercentage, 100)}
        sx={{
          height: 12,
          borderRadius: 5,
          backgroundColor: 'grey.200',
          border: '1px solid',
          borderColor: 'divider',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            transition: 'transform 0.4s linear',
          },
        }}
      />
    </Box>
  );
}
