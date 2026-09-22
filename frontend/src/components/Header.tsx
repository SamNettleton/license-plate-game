import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, Tooltip } from '@components';
import {
  HelpOutlineIcon as HelpIcon,
  BackIcon,
  RefreshIcon,
  BarChartIcon,
  SettingsIcon,
  TrophyIcon,
} from '@icons';
import HowToPlayModal from '@/components/modals/HowToPlayModal';
import SettingsModal from '@/components/modals/SettingsModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import { resetPracticeGame, hasPracticeProgress } from '@/utils/practiceRandomizer';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const [howToPlayModalOpen, setHowToPlayModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Normalize path by stripping trailing slashes (except root '/')
  const normalizedPathname =
    location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname;

  const isHomePage = normalizedPathname === '/';
  const isPracticePage = normalizedPathname === '/practice';
  const isDailyPage = normalizedPathname === '/daily';
  const isLeaderboardPage = normalizedPathname === '/leaderboard';
  const isStatsPage = normalizedPathname === '/stats';

  const searchParams = new URLSearchParams(location.search);
  const hasDateParam = searchParams.has('date');

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

  const handleBackClick = () => {
    const origin = (location.state as { origin?: string } | null)?.origin;

    if ((isDailyPage && hasDateParam) || origin === '/archive') {
      navigate('/archive', { replace: true });
      return;
    }

    if (origin) {
      navigate(-1);
      return;
    }

    navigate('/', { replace: true });
  };

  const handleLeaderboardClick = () => {
    const currentOrigin = (location.state as { origin?: string })?.origin || normalizedPathname;
    navigate(
      {
        pathname: '/leaderboard',
        search: location.search,
      },
      {
        state: {
          origin: currentOrigin === '/leaderboard' ? '/' : currentOrigin,
        },
        replace: isStatsPage,
      },
    );
  };

  const handleStatsClick = () => {
    const currentOrigin = (location.state as { origin?: string })?.origin || normalizedPathname;
    navigate(
      {
        pathname: '/stats',
        search: location.search,
      },
      {
        state: {
          origin: currentOrigin === '/stats' ? '/' : currentOrigin,
        },
        replace: isLeaderboardPage,
      },
    );
  };

  const originPath = (location.state as { origin?: string } | null)?.origin;

  const getBackTooltipTitle = () => {
    if ((isDailyPage && hasDateParam) || originPath === '/archive') {
      return 'Back to archive';
    }

    switch (originPath) {
      case '/daily':
      case '/':
        return 'Back to daily game';
      case '/practice':
        return 'Back to practice mode';
      case '/archive':
        return 'Back to archive';
      default:
        return 'Back to home';
    }
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <ConfirmationDialog
        content="This will clear your current progress. Continue?"
        open={confirmOpen}
        title="New Random Plate?"
        onConfirm={executeRandomize}
        onClose={() => setConfirmOpen(false)}
      />

      <Toolbar sx={toolbarStyles}>
        <Box sx={{ minWidth: 48, gap: 1, display: 'flex' }}>
          {!isHomePage && (
            <Tooltip title={getBackTooltipTitle()}>
              <IconButton
                aria-label="back"
                color="inherit"
                edge="start"
                sx={iconButtonStyles}
                onClick={handleBackClick}
              >
                <BackIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          )}
          {isPracticePage && (
            <Tooltip title="Randomize plate">
              <IconButton
                aria-label="randomize plate"
                color="inherit"
                edge="start"
                sx={iconButtonStyles}
                onClick={handleRandomizeClick}
              >
                <RefreshIcon sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 } }}>
          {!isLeaderboardPage && (
            <Tooltip title="Leaderboard">
              <IconButton
                aria-label="leaderboard"
                color="inherit"
                sx={iconButtonStyles}
                onClick={handleLeaderboardClick}
              >
                <TrophyIcon sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {!isStatsPage && (
            <Tooltip title="View stats">
              <IconButton
                aria-label="view stats"
                color="inherit"
                sx={iconButtonStyles}
                onClick={handleStatsClick}
              >
                <BarChartIcon sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {!isLeaderboardPage && !isStatsPage && (
            <Tooltip title="How to play">
              <IconButton
                aria-label="how to play"
                color="inherit"
                sx={iconButtonStyles}
                onClick={() => setHowToPlayModalOpen(true)}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Settings">
            <IconButton
              aria-label="settings"
              color="inherit"
              sx={iconButtonStyles}
              onClick={() => setSettingsModalOpen(true)}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <HowToPlayModal open={howToPlayModalOpen} onClose={() => setHowToPlayModalOpen(false)} />
        <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}

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
  p: { xs: 0.75, sm: 1 },
  '@media (max-height: 600px)': {
    padding: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
};
