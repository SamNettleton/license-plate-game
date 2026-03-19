import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Stack } from '@mui/material';
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
      <Typography variant="h3" component="h1" gutterBottom sx={gameTitleTypography}>
        License Plate Game
      </Typography>

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

const gameTitleTypography = {
  fontWeight: 'bold',
  textAlign: 'center',
  mb: 4,
  color: 'primary.main',
  fontSize: { xs: '2.5rem', sm: '3rem' },

  '@media (max-height: 520px)': {
    fontSize: '1.8rem',
    mb: 3,
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
