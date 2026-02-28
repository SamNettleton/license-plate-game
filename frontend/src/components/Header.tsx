import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, useColorScheme } from '@mui/material';
import {
  LightModeIcon as LightModeIcon,
  DarkModeIcon as DarkModeIcon,
  HelpOutlineIcon as HelpIcon,
  BackIcon as BackIcon,
} from '@icons';
import HowToPlayModal from '@/components/HowToPlayModal';
import Logo from '@/components/Logo';

export default function Header() {
  const { mode, setMode } = useColorScheme();
  const [modalOpen, setModalOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  if (!mode) return null;

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {/* Left Side: Back Button OR Spacer */}
        <Box sx={{ minWidth: 48 }}>
          {!isHomePage && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/')}
              aria-label="back to home"
            >
              <BackIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          )}
        </Box>
        {/* Center: The LPG Logo */}
        <Box
          onClick={() => navigate('/')}
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
        {/* Right Side: Action Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* How to Play Icon */}
          <IconButton color="inherit" onClick={() => setModalOpen(true)} aria-label="how to play">
            <HelpIcon />
          </IconButton>

          {/* Theme Toggle */}
          <IconButton
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            color="inherit"
            aria-label="toggle theme"
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
        <HowToPlayModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}
