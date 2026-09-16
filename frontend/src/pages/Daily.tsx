import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDailyPlate } from '../api/plateService';
import Game from '@/components/game/Game';
import { GameMode } from '@/constants/game';
import { Box, Fade } from '@components';
import LoadingDisplay from '@/components/feedback/LoadingDisplay';
import ErrorDisplay from '@/components/feedback/ErrorDisplay';
import { useSettings } from '@/context/SettingsContext';
import { EARLIEST_ACTIVE_DATE } from '@/constants/date';
import {
  getLocalDailyDate,
  toDateOnly,
  getLatestActiveGlobalDate,
  formatDateKey,
} from '@/utils/date';

function Daily() {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const playerId = settings.playerId;

  const minActiveDate = React.useMemo(() => toDateOnly(EARLIEST_ACTIVE_DATE), []);
  const maxActiveDate = React.useMemo(() => getLatestActiveGlobalDate(), []);

  const rawDateParam = searchParams.get('date');

  // Validate date parameter and check if it matches local today
  const { targetDate, isValidParam, isToday } = React.useMemo(() => {
    const todayStr = getLocalDailyDate();

    if (!rawDateParam) {
      return { targetDate: todayStr, isValidParam: true, isToday: true };
    }

    const parts = rawDateParam.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return { targetDate: todayStr, isValidParam: false, isToday: true };
    }

    const parsedDate = toDateOnly(new Date(parts[0], parts[1] - 1, parts[2]));

    if (parsedDate < minActiveDate || parsedDate > maxActiveDate) {
      return { targetDate: todayStr, isValidParam: false, isToday: true };
    }

    const dateKey = formatDateKey(parsedDate);
    return {
      targetDate: dateKey,
      isValidParam: true,
      isToday: dateKey === todayStr,
    };
  }, [rawDateParam, minActiveDate, maxActiveDate]);

  React.useEffect(() => {
    if (rawDateParam && (!isValidParam || isToday)) {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.delete('date');
          return updated;
        },
        { replace: true },
      );
    }
  }, [rawDateParam, isValidParam, isToday, setSearchParams]);

  const {
    data: challenge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dailyPlate', targetDate, playerId],
    queryFn: () => fetchDailyPlate(playerId, targetDate),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!playerId,
  });

  if (isLoading) return <LoadingDisplay message="Crafting daily plate..." />;
  if (error || !challenge) return <ErrorDisplay error={error} reset={refetch} />;

  return (
    <Fade in={true} timeout={1000}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Game
          key={`${challenge.sequence}-${targetDate}`}
          plate={challenge.sequence}
          solutionsCount={challenge.solutionsCount}
          goalPoints={challenge.goalPoints}
          wordsFound={challenge.wordsFound}
          pointsEarned={challenge.pointsEarned}
          elapsedSeconds={challenge.elapsedSeconds}
          tierTimes={challenge.tierTimes}
          mode={GameMode.DAILY}
          puzzleDate={targetDate}
          userId={playerId}
        />
      </Box>
    </Fade>
  );
}

export default Daily;
