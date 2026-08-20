import { useQuery } from '@tanstack/react-query';
import { fetchDailyPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';
import { Box, Fade } from '@components';
import LoadingDisplay from '@/components/feedback/LoadingDisplay';
import ErrorDisplay from '@/components/feedback/ErrorDisplay';
import { useSettings } from '@/context/SettingsContext';
import { getLocalDailyDate } from '@/utils/date';

function Daily() {
  const { settings } = useSettings();
  const playerId = settings.playerId;

  const today = getLocalDailyDate();

  const {
    data: challenge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dailyPlate', today],
    queryFn: fetchDailyPlate,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  if (isLoading) return <LoadingDisplay message="Crafting a daily plate..." />;
  if (error || !challenge) return <ErrorDisplay error={error} reset={refetch} />;

  return (
    <Fade in={true} timeout={1000}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Game
          key={challenge.sequence}
          plate={challenge.sequence}
          solutionsCount={challenge.solutionsCount}
          goalPoints={challenge.goalPoints}
          mode={GameMode.DAILY}
          puzzleDate={today}
          userId={playerId}
        />
      </Box>
    </Fade>
  );
}

export default Daily;
