import { useQuery } from '@tanstack/react-query';
import { fetchRandomPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';
import { Box } from '@components';

const PLATE_STORAGE_KEY = 'lp_practice_current_plate';

function Practice() {
  const {
    data: challenge,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['randomPlate'],
    queryFn: fetchPlate,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) return <div>Spinning up a new plate...</div>;
  if (error || !challenge) return <div>Error loading game.</div>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Game
        key={challenge.sequence}
        plate={challenge.sequence}
        solutionsCount={challenge.solutionsCount}
        goalPoints={challenge.goalPoints}
        mode={GameMode.PRACTICE}
      />
    </Box>
  );
}

const fetchPlate = async () => {
  const saved = localStorage.getItem(PLATE_STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  const newPlate = await fetchRandomPlate();
  localStorage.setItem(PLATE_STORAGE_KEY, JSON.stringify(newPlate));
  return newPlate;
};

export default Practice;
