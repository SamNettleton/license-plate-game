import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, Tooltip, useColorScheme, Snackbar } from '@components';
import {
  LightModeIcon,
  DarkModeIcon,
  HelpOutlineIcon as HelpIcon,
  BackIcon,
  RefreshIcon,
  ShareIcon,
} from '@icons';
import HowToPlayModal from '@/components/modals/HowToPlayModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import Logo from '@/components/Logo';
import { resetPracticeGame, hasPracticeProgress } from '@/utils/practiceRandomizer';
import { useQueryClient } from '@tanstack/react-query';
import { getMilestone } from '@/constants/game';

export default function Header() {
  const { mode, setMode } = useColorScheme();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [shareToastOpen, setShareToastOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isHomePage = location.pathname === '/';
  const isDailyPage = location.pathname === '/daily';
  const isPracticePage = location.pathname === '/practice';

  const handleShare = async () => {
    const gameStats = queryClient.getQueryData(['active-game-results']);

    if (!gameStats) {
      console.warn('No active game data found to share.');
      return;
    }

    try {
      const textToShare = formatGameStatsForSharing(gameStats);
      await navigator.clipboard.writeText(textToShare);
      setShareToastOpen(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRandomizeClick = () => {
    if (hasPracticeProgress()) {
      setConfirmOpen(true);
    } else {
      executeRandomize();
    }
  };

  const executeRandomize = () => {
    resetPracticeGame(queryClient);
  };

  if (!mode) return null;

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      {/* Confirmation Dialog for destructive action */}
      <ConfirmationDialog
        open={confirmOpen}
        title="New Random Plate?"
        content="This will clear your current progress. Continue?"
        onConfirm={executeRandomize}
        onClose={() => setConfirmOpen(false)}
      />

      <Toolbar sx={toolbarStyles}>
        <Box sx={{ minWidth: 48, gap: 1, display: 'flex' }}>
          {!isHomePage && (
            <Tooltip title="Back to home">
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => navigate('/')}
                aria-label="back to home"
                sx={iconButtonStyles}
              >
                <BackIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          )}
          {isPracticePage && (
            <Tooltip title="Randomize plate">
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleRandomizeClick}
                aria-label="randomize plate"
                sx={iconButtonStyles}
              >
                <RefreshIcon sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={logoStyles}>{isHomePage && <Logo />}</Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isDailyPage && (
            <Tooltip title="Share results">
              <IconButton
                color="inherit"
                onClick={handleShare}
                aria-label="share results"
                sx={iconButtonStyles}
              >
                <ShareIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="How to play">
            <IconButton
              color="inherit"
              onClick={() => setModalOpen(true)}
              aria-label="how to play"
              sx={iconButtonStyles}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              color="inherit"
              aria-label="toggle theme"
              sx={iconButtonStyles}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <HowToPlayModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </Toolbar>

      <Snackbar
        open={shareToastOpen}
        autoHideDuration={2000}
        onClose={() => setShareToastOpen(false)}
        message="Results copied to clipboard!"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 7,
        }}
      />
    </AppBar>
  );
}

const formatGameStatsForSharing = (gameStats: any) => {
  if (!gameStats) return '';

  const { points, goalPoints } = gameStats;
  const currentPercentage = goalPoints > 0 ? (points / goalPoints) * 100 : 0;

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // 6 Thresholds to fill 6 squares: 1, 25, 50, 75, 90, 100
  const thresholds = [1, 25, 50, 75, 90, 100];

  const { label, emoji, filledEmoji } = getMilestone(currentPercentage);
  const emptyEmoji = '⬛';

  const visualBar = thresholds
    .map((t) => (currentPercentage >= t ? filledEmoji : emptyEmoji))
    .join('');

  return [
    `License Plate Game • ${dateStr}`,
    '',
    `${label} ${emoji} (${points} pts)`,
    visualBar,
    '',
    window.location.origin,
  ].join('\n');
};

const toolbarStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  position: 'relative',
  minHeight: { xs: '48px', sm: '64px' },
  '@media (max-height: 600px)': {
    minHeight: '40px',
    px: 1,
  },
};

const iconButtonStyles = {
  '@media (max-height: 600px)': {
    padding: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
};

const logoStyles = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1,
  display: 'flex',

  '@media (max-height: 600px), (max-width: 360px)': {
    transform: 'translateX(-50%) scale(0.8)',
  },
};
