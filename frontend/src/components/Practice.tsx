import { useQuery } from '@tanstack/react-query';
import { fetchRandomPlate } from '../api/plateService';
import Game from './Game';

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
    staleTime: 0, // Ensures we get a fresh plate when we ask
  });
  console.log('plate:', challenge);

  if (isLoading) return <div>Spinning up a new plate...</div>;
  if (error || !challenge) return <div>Error loading game.</div>;

  return (
    <div className="App">
      <button onClick={() => refetch()}>New Random Plate</button>
      <Game plate={challenge.sequence} solutionsCount={challenge.solutionsCount}></Game>
    </div>
  );
}

export default Practice;
