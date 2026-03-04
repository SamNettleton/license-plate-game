import { useQuery } from '@tanstack/react-query';
import { fetchDailyPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';
import { Box } from '@components';

function Daily() {
  const {
    data: challenge,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dailyPlate'],
    queryFn: fetchDailyPlate,
    staleTime: Infinity,
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
        mode={GameMode.DAILY}
      ></Game>
    </Box>
  );
}

export default Daily;
