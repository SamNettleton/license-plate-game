import { useQuery } from '@tanstack/react-query';
import { fetchDailyPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';

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
    <div className="App">
      <Game
        key={challenge.sequence}
        plate={challenge.sequence}
        solutionsCount={challenge.solutionsCount}
        mode={GameMode.DAILY}
      ></Game>
    </div>
  );
}

export default Daily;
