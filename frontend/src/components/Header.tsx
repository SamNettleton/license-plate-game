import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, Tooltip, useColorScheme } from '@components';
import {
  LightModeIcon,
  DarkModeIcon,
  HelpOutlineIcon as HelpIcon,
  BackIcon,
  RefreshIcon,
} from '@icons';
import HowToPlayModal from '@/components/modals/HowToPlayModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import Logo from '@/components/Logo';
import { resetPracticeGame, hasPracticeProgress } from '@/utils/practiceRandomizer';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { mode, setMode } = useColorScheme();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isHomePage = location.pathname === '/';
  const isPracticePage = location.pathname === '/practice';

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

      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <Box sx={{ minWidth: 48, gap: 1, display: 'flex' }}>
          {!isHomePage && (
            <Tooltip title="Back to home">
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => navigate('/')}
                aria-label="back to home"
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
              >
                <RefreshIcon sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            display: 'flex',
          }}
        >
          {isHomePage && <Logo />}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="How to play">
            <IconButton color="inherit" onClick={() => setModalOpen(true)} aria-label="how to play">
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              color="inherit"
              aria-label="toggle theme"
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <HowToPlayModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}
