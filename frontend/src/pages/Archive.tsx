import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper } from '@/material-ui';
import { Calendar } from '@/components/common/Calendar';
import { EARLIEST_ACTIVE_DATE } from '@/constants/date';
import { formatDateKey, toDateOnly, getLatestActiveGlobalDate } from '@/utils/date';
import { fetchMonthlyArchive, DailySummaryArchiveItem } from '@/api/archiveService';
import { useSettings } from '@/context/SettingsContext';
import { getMilestone } from '@/constants/game';
import ArchivePuzzleCard from '@/components/archive/ArchivePuzzleCard';

function Archive() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [selectedDate, setSelectedDate] = React.useState(() => toDateOnly(new Date()));
  const [viewDate, setViewDate] = React.useState(() => new Date());

  const [monthlySummaries, setMonthlySummaries] = React.useState<
    Map<string, DailySummaryArchiveItem>
  >(new Map());
  const [isLoading, setIsLoading] = React.useState(false);

  const minActiveDate = React.useMemo(() => toDateOnly(EARLIEST_ACTIVE_DATE), []);
  const maxActiveDate = React.useMemo(() => getLatestActiveGlobalDate(), []);

  const userId = settings?.playerId;
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth() + 1;

  React.useEffect(() => {
    let isSubscribed = true;

    if (!userId) return;

    setIsLoading(true);

    fetchMonthlyArchive(userId, viewYear, viewMonth)
      .then((res) => {
        if (!isSubscribed) return;
        const summaryMap = new Map<string, DailySummaryArchiveItem>();
        (res.summaries || []).forEach((item) => {
          summaryMap.set(item.date, item);
        });
        setMonthlySummaries(summaryMap);
      })
      .catch((err) => {
        console.error('Failed to load archive data:', err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [userId, viewYear, viewMonth]);

  const getDayStatus = React.useCallback(
    (dateKey: string) => {
      const apiSummary = monthlySummaries.get(dateKey);
      if (!apiSummary || apiSummary.pointsEarned <= 0) return undefined;

      const percent = (apiSummary.pointsEarned / apiSummary.goalPoints) * 100;
      const milestone = getMilestone(percent);

      return {
        emoji: milestone.emoji,
      };
    },
    [monthlySummaries],
  );

  const handleSelectDate = (date: Date) => {
    const bounded = toDateOnly(date);
    if (bounded < minActiveDate || bounded > maxActiveDate) return;
    setSelectedDate(bounded);
  };

  const handlePlayPuzzle = () => {
    const dateKey = formatDateKey(selectedDate);
    navigate(`/daily/?date=${dateKey}`);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const activeSummary = monthlySummaries.get(selectedDateKey);

  return (
    <Box sx={containerStyles}>
      <Box sx={headerRowStyles}>
        <Typography variant="h5" fontWeight={700}>
          Puzzle Archive
        </Typography>
        {isLoading && <CircularProgress size={20} />}
      </Box>

      <Paper elevation={0} variant="outlined" sx={calendarPaperStyles}>
        <Calendar
          selectedDate={selectedDate}
          minDate={minActiveDate}
          maxDate={maxActiveDate}
          onSelectDate={handleSelectDate}
          onMonthChange={(newViewDate) => setViewDate(newViewDate)}
          getDayStatus={getDayStatus}
        />
      </Paper>

      <Box sx={contentSectionStyles}>
        {activeSummary ? (
          <ArchivePuzzleCard
            date={selectedDate}
            sequence={activeSummary.sequence}
            goalPoints={activeSummary.goalPoints}
            pointsEarned={activeSummary.pointsEarned}
            wordsFound={activeSummary.wordsFound}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No puzzle data available for this day.
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handlePlayPuzzle}
        >
          Play Puzzle
        </Button>
      </Box>
    </Box>
  );
}

const containerStyles = {
  width: '100%',
  maxWidth: 420,
  mx: 'auto',
  p: { xs: 2, sm: 3 },
  maxHeight: '100vh',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

const headerRowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
};

const calendarPaperStyles = {
  p: 2,
  borderRadius: 2,
};

const contentSectionStyles = {
  mt: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  pb: 2,
};

export default Archive;
