import { useQuery } from '@tanstack/react-query';
import { fetchRandomPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';
import { Box, Fade } from '@components';
import LoadingDisplay from '@/components/feedback/LoadingDisplay';
import ErrorDisplay from '@/components/feedback/ErrorDisplay';

const PLATE_STORAGE_KEY = 'lp_practice_current_plate';

function Practice() {
  const {
    data: challenge,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['randomPlate'],
    queryFn: fetchPlate,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading || isFetching) return <LoadingDisplay message="Crafting a random plate..." />;
  if (error || !challenge) return <ErrorDisplay error={error} reset={refetch} />;

  return (
    <Fade in={true} timeout={1000}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Game
          key={challenge.sequence}
          plate={challenge.sequence}
          solutionsCount={challenge.solutionsCount}
          goalPoints={challenge.goalPoints}
          mode={GameMode.PRACTICE}
        />
      </Box>
    </Fade>
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
