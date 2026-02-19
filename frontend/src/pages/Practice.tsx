import { useQuery } from '@tanstack/react-query';
import { fetchRandomPlate } from '../api/plateService';
import Game from '@/components/game/Game';

function Practice() {
  // 'queryKey' handles caching; 'queryFn' is your service call
  const {
    data: challenge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['randomPlate'],
    queryFn: fetchRandomPlate,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  console.log('plate:', challenge);

  if (isLoading) return <div>Spinning up a new plate...</div>;
  if (error || !challenge) return <div>Error loading game.</div>;

  return (
    <div className="App">
      <button onClick={() => refetch()}>New Random Plate</button>
      <Game
        key={challenge.sequence}
        plate={challenge.sequence}
        solutionsCount={challenge.solutionsCount}
      ></Game>
    </div>
  );
}

export default Practice;
