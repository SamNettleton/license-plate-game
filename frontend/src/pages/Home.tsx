import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Stack } from '@/material-ui';
import Logo from '@/components/Logo';
import HowToPlayModal from '@/components/modals/HowToPlayModal';

function Home() {
  const navigate = useNavigate();

  const dailyPage = () => navigate('/daily');
  const practicePage = () => navigate('/practice');

  const [showInstructions, setShowInstructions] = React.useState(false);

  React.useEffect(() => {
    // Auto-show instructions for new users
    const hasVisited = localStorage.getItem('lp_visited');
    if (!hasVisited) {
      setShowInstructions(true);
      localStorage.setItem('lp_visited', 'true');
    }
  }, []);

  return (
    <Box sx={homeContainerStyles}>
      <Stack spacing={5} alignItems="center" sx={heroBrandingStyles}>
        <Box sx={logoWrapperStyles}>
          <Logo />
        </Box>
        <Typography variant="h3" component="h1" sx={gameTitleTypography}>
          License Plate Game
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ width: '80%', maxWidth: '300px' }}>
        <Button variant="contained" size="large" fullWidth onClick={dailyPage} sx={buttonStyles}>
          Daily Challenge
        </Button>
        <Button variant="outlined" size="large" fullWidth onClick={practicePage} sx={buttonStyles}>
          Practice
        </Button>
      </Stack>

      <HowToPlayModal open={showInstructions} onClose={() => setShowInstructions(false)} />
    </Box>
  );
}

export default Home;

const homeContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  px: 2,
};

const heroBrandingStyles = {
  mb: 4,
  '@media (max-height: 520px)': {
    mb: 2.5,
  },
};

const logoWrapperStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transform: 'scale(1.5)',
  mb: 1,
  '@media (max-height: 520px)': {
    transform: 'scale(1)',
    mb: 0,
  },
};

const gameTitleTypography = {
  fontWeight: 'bold',
  textAlign: 'center',
  color: 'primary.main',
  fontSize: { xs: '2rem', sm: '2.5rem' },
  lineHeight: 1.2,
  '@media (max-height: 520px)': {
    fontSize: '1.5rem',
  },
};

const buttonStyles = {
  py: 1.5,
  fontSize: '1.1rem',
  '@media (max-height: 520px)': {
    py: 1,
    fontSize: '0.9rem',
  },
};
