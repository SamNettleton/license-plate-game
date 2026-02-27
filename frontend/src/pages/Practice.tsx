import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRandomPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode, STORAGE_KEY } from '@/constants/game';

const PLATE_STORAGE_KEY = 'lp_practice_current_plate';
const GUESSES_STORAGE_KEY = STORAGE_KEY[GameMode.PRACTICE];

function Practice() {
  const queryClient = useQueryClient();

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

  const handleNewPlate = async () => {
    localStorage.removeItem(PLATE_STORAGE_KEY);
    localStorage.removeItem(GUESSES_STORAGE_KEY);
    queryClient.invalidateQueries({ queryKey: ['randomPlate'] });
  };

  if (isLoading) return <div>Spinning up a new plate...</div>;
  if (error || !challenge) return <div>Error loading game.</div>;

  return (
    <div className="App">
      <button onClick={handleNewPlate}>New Random Plate</button>
      <Game
        key={challenge.sequence}
        plate={challenge.sequence}
        solutionsCount={challenge.solutionsCount}
        goalPoints={challenge.goalPoints}
        mode={GameMode.PRACTICE}
      ></Game>
    </div>
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
