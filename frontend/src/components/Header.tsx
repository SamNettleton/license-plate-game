import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, Tooltip, useColorScheme } from '@components';
import {
  LightModeIcon,
  DarkModeIcon,
  HelpOutlineIcon as HelpIcon,
  BackIcon,
  RefreshIcon,
  BarChartIcon,
} from '@icons';
import HowToPlayModal from '@/components/modals/HowToPlayModal';
import ResultsModal from '@/components/modals/ResultsModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import Logo from '@/components/Logo';
import { resetPracticeGame, hasPracticeProgress } from '@/utils/practiceRandomizer';
import { useQueryClient } from '@tanstack/react-query';

type HeaderProps = {
  resultsOpen: boolean;
  setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Header({ resultsOpen, setResultsOpen }: HeaderProps) {
  const { mode, setMode } = useColorScheme();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isHomePage = location.pathname === '/';
  const isDailyPage = location.pathname === '/daily';
  const isPracticePage = location.pathname === '/practice';

  type ActiveGameTierData = {
    elapsedSeconds: number;
    goalPoints: number;
    plate: string;
    points: number;
    tierTimes: Record<string, number>;
  };

  const [gameTierData, setGameTierData] = React.useState<ActiveGameTierData | undefined>(
    queryClient.getQueryData<ActiveGameTierData>(['active-game-tier-times']),
  );

  React.useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      setGameTierData(queryClient.getQueryData<ActiveGameTierData>(['active-game-tier-times']));
    });
    return unsubscribe;
  }, [queryClient]);

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
        content="This will clear your current progress. Continue?"
        open={confirmOpen}
        title="New Random Plate?"
        onConfirm={executeRandomize}
        onClose={() => setConfirmOpen(false)}
      />

      <Toolbar sx={toolbarStyles}>
        <Box sx={{ minWidth: 48, gap: 1, display: 'flex' }}>
          {!isHomePage && (
            <Tooltip title="Back to home">
              <IconButton
                aria-label="back to home"
                color="inherit"
                edge="start"
                sx={iconButtonStyles}
                onClick={() => navigate('/')}
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

        <Box sx={logoStyles}>{isHomePage && <Logo />}</Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(isDailyPage || isPracticePage) && (
            <Tooltip title="View stats">
              <IconButton
                aria-label="view stats"
                color="inherit"
                sx={iconButtonStyles}
                onClick={() => setResultsOpen(true)}
              >
                <BarChartIcon sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="How to play">
            <IconButton
              aria-label="how to play"
              color="inherit"
              sx={iconButtonStyles}
              onClick={() => setModalOpen(true)}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              aria-label="toggle theme"
              color="inherit"
              sx={iconButtonStyles}
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <HowToPlayModal open={modalOpen} onClose={() => setModalOpen(false)} />
        {(isDailyPage || isPracticePage) && (
          <ResultsModal
            elapsedSeconds={gameTierData?.elapsedSeconds ?? 0}
            goalPoints={gameTierData?.goalPoints ?? 0}
            open={resultsOpen}
            plate={gameTierData?.plate ?? ''}
            points={gameTierData?.points ?? 0}
            showShareButton={isDailyPage}
            tierTimes={gameTierData?.tierTimes ?? {}}
            onClose={() => setResultsOpen(false)}
          />
        )}
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
