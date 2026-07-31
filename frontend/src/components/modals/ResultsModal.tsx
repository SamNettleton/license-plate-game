import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  Slide,
  useTheme,
  useMediaQuery,
} from '@components';
import type { TransitionProps } from '@mui/material/transitions';
import { CloseIcon, BarChartIcon, ShareIcon } from '@icons';
import { getMilestone, TIER_THRESHOLDS } from '@/constants/game';
import { useQueryClient } from '@tanstack/react-query';

/** Format seconds as m:ss */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type Props = {
  goalPoints: number;
  open: boolean;
  plate: string;
  points: number;
  tierTimes: Record<string, number>;
  onClose: () => void;
  onShare?: () => void;
};

type ActiveGameTierData = {
  elapsedSeconds?: number;
  tierTimes?: Record<string, number>;
};

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ResultsModal({
  goalPoints,
  open,
  plate,
  points,
  tierTimes,
  onClose,
  onShare,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const queryClient = useQueryClient();
  const activeData = queryClient.getQueryData<ActiveGameTierData>(['active-game-tier-times']);
  const liveElapsed = activeData?.elapsedSeconds ?? 0;
  const liveTierTimes = activeData?.tierTimes ?? tierTimes;

  const currentPercentage = goalPoints > 0 ? (points / goalPoints) * 100 : 0;
  const { label: currentLabel, emoji: currentEmoji } = getMilestone(currentPercentage);

  const getCurrentTierIndex = () => {
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      if (currentPercentage >= TIER_THRESHOLDS[i].percent) return i;
    }
    return 0;
  };
  const currentTierIndex = getCurrentTierIndex();

  // Array storing resolved cumulative elapsed seconds for every tier up to current
  const resolvedTierTimes = TIER_THRESHOLDS.map((tier, index) => {
    if (index === currentTierIndex) {
      return liveTierTimes[tier.label] ?? liveElapsed ?? 0;
    }
    return liveTierTimes[tier.label] ?? 0;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="results-modal-title"
      slots={{
        transition: isMobile ? SlideUp : undefined,
      }}
      slotProps={{
        paper: { sx: isMobile ? mobileDialogStyles : desktopDialogStyles },
        backdrop: { sx: backdropStyles },
      }}
    >
      {/* Header */}
      <DialogTitle id="results-modal-title" sx={headerStyles}>
        <Box sx={headerTitleContainerStyles}>
          <BarChartIcon sx={chartIconStyles} />
          <Typography variant="h6" component="span" fontWeight="bold">
            Results
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close results" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={dialogContentStyles}>
        {/* Current status summary */}
        <Box sx={summaryBoxStyles}>
          <Typography variant="h4" sx={emojiHeadingStyles}>
            {currentEmoji}
          </Typography>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
              {currentLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {points} / {goalPoints} pts &nbsp;·&nbsp;{' '}
              {goalPoints > 0 ? Math.round(currentPercentage) : 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Total time: {formatTime(liveElapsed)}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
              {plate}
            </Typography>
          </Box>
        </Box>

        {/* Tier breakdown */}
        <Typography variant="overline" color="text.secondary" sx={tierBreakdownHeaderStyles}>
          Tier Splits
        </Typography>

        <Box sx={tiersContainerStyles}>
          {TIER_THRESHOLDS.map((tier, index) => {
            const isCurrentTier = index === currentTierIndex;
            const isFutureTier = index > currentTierIndex;

            const cumulativeTime = resolvedTierTimes[index];
            const prevCumulativeTime = index > 0 ? resolvedTierTimes[index - 1] : 0;
            const splitDuration = cumulativeTime - prevCumulativeTime;

            return (
              <Box key={tier.label} sx={tierRowStyles(isCurrentTier, isFutureTier)}>
                <Box sx={tierLabelContainerStyles}>
                  <Typography sx={tierEmojiStyles}>{tier.emoji}</Typography>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={isCurrentTier ? 700 : 400}
                      color={isFutureTier ? 'text.disabled' : 'text.primary'}
                    >
                      {tier.label}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {Math.ceil((tier.percent / 100) * goalPoints)} pts ({tier.percent}%)
                    </Typography>
                  </Box>
                </Box>

                <Box sx={timeContainerStyles}>
                  {isFutureTier ? (
                    <Typography variant="body2" color="text.disabled" sx={monoFontStyles}>
                      —
                    </Typography>
                  ) : (
                    <>
                      {/* Primary stat: Split duration spent in this tier */}
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={splitTimeStyles(isCurrentTier)}
                      >
                        {formatTime(Math.max(0, splitDuration))}
                      </Typography>

                      {/* Secondary stat: Total elapsed time milestone (only shown after tier 1) */}
                      {index > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={monoFontStyles}>
                          Total {formatTime(cumulativeTime)}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      {/* Sticky Action Footer */}
      {onShare && (
        <DialogActions sx={stickyFooterStyles}>
          <Button
            variant="contained"
            fullWidth
            onClick={onShare}
            startIcon={<ShareIcon />}
            sx={shareButtonStyles}
          >
            Share Results
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const backdropStyles = {
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
};

const mobileDialogStyles = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  m: 0,
  width: '100%',
  maxWidth: '100% !important',
  borderRadius: '16px 16px 0 0',
  maxHeight: '85dvh',
  backgroundImage: 'none',
};

const desktopDialogStyles = {
  borderRadius: 3,
  backgroundImage: 'none',
};

const headerStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pb: 1,
  pr: 1,
};

const headerTitleContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const chartIconStyles = {
  color: 'primary.main',
  fontSize: '1.4rem',
};

const dialogContentStyles = {
  px: 2.5,
  pt: 2,
  pb: 3,
  overflowY: 'auto', // Scrollable interior
};

const summaryBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 2,
  borderRadius: 2,
  backgroundColor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
};

const emojiHeadingStyles = {
  fontWeight: 900,
  lineHeight: 1,
};

const tierBreakdownHeaderStyles = {
  display: 'block',
  mt: 2.5,
  mb: 1,
  letterSpacing: '0.1em',
};

const tiersContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

const tierLabelContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flex: 1,
};

const tierEmojiStyles = {
  fontSize: '1.25rem',
  lineHeight: 1,
};

const timeContainerStyles = {
  textAlign: 'right',
  minWidth: '80px',
};

const monoFontStyles = {
  fontFamily: 'monospace',
  display: 'block',
};

const splitTimeStyles = (isCurrentTier: boolean) => ({
  fontFamily: 'monospace',
  color: isCurrentTier ? 'primary.main' : 'text.primary',
});

const shareButtonStyles = {
  mx: 'auto',
  display: 'flex',
  textTransform: 'none',
  fontWeight: 'bold',
  width: '80%',
  '& .MuiButton-startIcon': {
    marginTop: '-4px',
  },
};

const tierRowStyles = (isCurrentTier: boolean, isFutureTier: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 1.5,
  py: 1,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: isCurrentTier ? 'primary.main' : 'divider',
  backgroundColor: isCurrentTier ? 'action.selected' : 'transparent',
  opacity: isFutureTier ? 0.45 : 1,
  transition: 'background-color 0.2s',
});

const stickyFooterStyles = {
  p: 2,
  borderTop: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
};
