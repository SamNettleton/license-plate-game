import { Box, Typography, Paper, Chip } from '@/material-ui';
import { getMilestone } from '@/constants/game';

interface ArchivePuzzleCardProps {
  date: Date;
  sequence: string;
  goalPoints: number;
  pointsEarned: number;
  wordsFound: string[];
}

export default function ArchivePuzzleCard({
  date,
  sequence,
  goalPoints,
  pointsEarned,
  wordsFound,
}: ArchivePuzzleCardProps) {
  const isPlayed = pointsEarned > 0;
  const percent = goalPoints > 0 ? (pointsEarned / goalPoints) * 100 : 0;
  const milestone = getMilestone(percent);

  const displayDateString = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Paper variant="outlined" sx={cardContainerStyles}>
      {/* Top row: Date and Status / Tier Badge */}
      <Box sx={topRowStyles}>
        <Typography variant="subtitle1" fontWeight={700}>
          {displayDateString}
        </Typography>
        {isPlayed ? (
          <Chip
            icon={<span style={emojiSpanStyles}>{milestone.emoji}</span>}
            label={milestone.label}
            color="success"
            variant="outlined"
            size="small"
            sx={chipStyles}
          />
        ) : (
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Not Played Yet
          </Typography>
        )}
      </Box>

      {/* Content row: Mini plate and score display */}
      <Box sx={contentRowStyles}>
        <Box sx={miniPlateStyles}>{sequence}</Box>

        <Box sx={scoreSectionStyles}>
          <Typography variant="caption" color="text.secondary" display="block">
            Score
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
            {pointsEarned ?? 0}{' '}
            <Typography component="span" variant="body2" color="text.secondary" fontWeight={500}>
              / {goalPoints}
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {wordsFound?.length ?? 0} words found
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

const cardContainerStyles = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  bgcolor: 'background.default',
  borderRadius: 2,
};

const topRowStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const emojiSpanStyles = {
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '0.25rem',
};

const chipStyles = {
  fontWeight: 600,
};

const contentRowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const scoreSectionStyles = {
  textAlign: 'right',
};

const miniPlateStyles = {
  position: 'relative',
  width: 'fit-content',
  fontSize: '1.75rem',
  padding: '0.6rem 0.8rem 0.3rem 1rem',
  fontWeight: '900',
  borderRadius: 2,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  letterSpacing: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  textShadow: '0px 1px 1px rgba(0, 0, 0, 0.4), 0px -1px 1px rgba(255, 255, 255, 0.3)',
  boxShadow: `
    0px 0px 2px 1px rgba(0, 0, 0, 0.3), 
    0px 4px 10px rgba(0, 0, 0, 0.15), 
    inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
  `,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '4px',
    left: '4px',
    right: '4px',
    bottom: '4px',
    border: '2px solid',
    borderRadius: 1.5,
    pointerEvents: 'none',
    boxShadow: `
      0px 0px 1px 1px rgba(0, 0, 0, 0.3),
      inset 0px 0px 1px 1px rgba(0, 0, 0, 0.2),
      -1px -1px 1px rgba(255, 255, 255, 0.3),
      inset -1px -1px 1px rgba(255, 255, 255, 0.2)
    `,
  },
};
