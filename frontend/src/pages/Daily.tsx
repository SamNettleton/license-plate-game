import { useQuery } from '@tanstack/react-query';
import { fetchDailyPlate } from '../api/plateService';
import Game from '@/components/game/Game';

function Daily() {
  // 'queryKey' handles caching; 'queryFn' is your service call
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
      ></Game>
    </div>
  );
}

export default Daily;
