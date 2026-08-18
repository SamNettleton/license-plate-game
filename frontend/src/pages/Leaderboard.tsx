import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import {
  formatDateKey,
  toDateOnly,
  addDays,
  startOfMonth,
  daysInMonth,
  getLatestActiveGlobalDate,
} from '@/utils/date';
import { EARLIEST_ACTIVE_DATE } from '@/constants/date';
import { useSettings } from '@/context/SettingsContext';
import { fetchDailyLeaderboard, type LeaderboardResponse } from '@/api/leaderboardService';

function Leaderboard() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { settings } = useSettings();

  const maxActiveDate = React.useMemo(() => getLatestActiveGlobalDate(), []);
  const minActiveDate = React.useMemo(() => toDateOnly(EARLIEST_ACTIVE_DATE), []);

  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = toDateOnly(new Date());
    if (today > maxActiveDate) return maxActiveDate;
    if (today < minActiveDate) return minActiveDate;
    return today;
  });

  const [calendarAnchor, setCalendarAnchor] = React.useState<HTMLButtonElement | null>(null);

  const calendarOpen = Boolean(calendarAnchor);

  const handleOpenCalendar = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchor(event.currentTarget);
  };

  const handleCloseCalendar = () => {
    setCalendarAnchor(null);
  };

  const selectedDateKey = formatDateKey(selectedDate);

  const {
    data: leaderboard = { entries: [], currentUser: undefined },
    isLoading,
    error,
    refetch,
  } = useQuery<LeaderboardResponse>({
    queryKey: ['dailyLeaderboard', selectedDateKey, settings.playerId],
    queryFn: () => fetchDailyLeaderboard(selectedDateKey, settings.playerId, 10),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const leaderboardEntries = leaderboard.entries;
  const currentUserEntry = leaderboard.currentUser;

  const monthLabel = selectedDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isPrevDayDisabled = selectedDate <= minActiveDate;
  const isNextDayDisabled = selectedDate >= maxActiveDate;

  const isPrevMonthDisabled = startOfMonth(selectedDate) <= startOfMonth(minActiveDate);
  const isNextMonthDisabled = startOfMonth(selectedDate) >= startOfMonth(maxActiveDate);

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const totalCells = Math.ceil((daysInMonth(selectedDate) + firstWeekday) / 7) * 7;
    const cells: Array<{ date: Date; inMonth: boolean; isSelected: boolean; isDisabled: boolean }> =
      [];

    for (let index = 0; index < totalCells; index += 1) {
      const currentDate = addDays(monthStart, index - firstWeekday);
      const inMonth = currentDate.getMonth() === selectedDate.getMonth();
      const isSelected = formatDateKey(currentDate) === formatDateKey(selectedDate);
      const isDisabled = currentDate < minActiveDate || currentDate > maxActiveDate;

      cells.push({ date: currentDate, inMonth, isSelected, isDisabled });
    }

    return cells;
  }, [selectedDate, minActiveDate, maxActiveDate]);

  const moveByDays = (amount: number) => {
    setSelectedDate((current) => {
      const next = addDays(current, amount);
      if (next < minActiveDate) return minActiveDate;
      if (next > maxActiveDate) return maxActiveDate;
      return next;
    });
    handleCloseCalendar();
  };

  const moveByMonth = (amount: number) => {
    setSelectedDate((current) => {
      const targetMonth = new Date(current.getFullYear(), current.getMonth() + amount, 1);
      if (targetMonth < minActiveDate) return minActiveDate;
      if (targetMonth > maxActiveDate) return maxActiveDate;
      return targetMonth;
    });
  };

  const goToDate = (date: Date) => {
    if (date < minActiveDate || date > maxActiveDate) return;
    setSelectedDate(toDateOnly(date));
    handleCloseCalendar();
  };

  const renderCalendarContent = () => (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <IconButton
          size="small"
          onClick={() => moveByMonth(-1)}
          disabled={isPrevMonthDisabled}
          aria-label="previous month"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700}>
          {monthLabel}
        </Typography>
        <IconButton
          size="small"
          onClick={() => moveByMonth(1)}
          disabled={isNextMonthDisabled}
          aria-label="next month"
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          textAlign: 'center',
          mb: 1,
        }}
      >
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <Typography key={idx} variant="caption" color="text.secondary" fontWeight={700}>
            {day}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
        }}
      >
        {calendarDays.map(({ date, inMonth, isSelected, isDisabled }) => (
          <Button
            key={formatDateKey(date)}
            size="small"
            disabled={isDisabled}
            onClick={() => goToDate(date)}
            sx={{
              minWidth: 0,
              p: 0.75,
              borderRadius: 1.5,
              color: isSelected
                ? 'primary.contrastText'
                : isDisabled
                  ? 'text.disabled'
                  : inMonth
                    ? 'text.primary'
                    : 'text.disabled',
              bgcolor: isSelected ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: isSelected ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            {date.getDate()}
          </Button>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
        }}
      >
        {/* Main Leaderboard Card */}
        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            bgcolor: 'background.paper',
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Leaderboard
            </Typography>

            {!isDesktop && (
              <IconButton aria-label="pick date" color="primary" onClick={handleOpenCalendar}>
                <CalendarIcon />
              </IconButton>
            )}
          </Stack>

          {/* Date Selector Row */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <IconButton
              aria-label="previous day"
              onClick={() => moveByDays(-1)}
              disabled={isPrevDayDisabled}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>

            <Box
              component="button"
              onClick={handleOpenCalendar}
              sx={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                p: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                {monthLabel}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {selectedLabel}
              </Typography>
            </Box>

            <IconButton
              aria-label="next day"
              onClick={() => moveByDays(1)}
              disabled={isNextDayDisabled}
              size="small"
            >
              <ArrowForwardIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Typography variant="body1" color="text.secondary">
              Loading leaderboard...
            </Typography>
          ) : error ? (
            <Box>
              <Typography variant="body1" color="error.main">
                Unable to load the leaderboard for this day.
              </Typography>
              <Button variant="text" onClick={() => void refetch()} sx={{ mt: 1 }}>
                Retry
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
              <Box
                sx={{
                  maxHeight: { xs: '50vh', md: '500px' },
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'action.focus',
                    borderRadius: '3px',
                  },
                }}
              >
                <Stack spacing={1.5}>
                  {leaderboardEntries.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      No scores yet for this day.
                    </Typography>
                  ) : (
                    leaderboardEntries.map((entry) => (
                      <Box
                        key={`${entry.name}-${entry.rank}`}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '44px 1fr auto',
                          alignItems: 'center',
                          gap: 2,
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: entry.isCurrentUser ? 'primary.main' : 'transparent',
                          backgroundColor: entry.isCurrentUser ? 'action.selected' : 'transparent',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color={entry.isCurrentUser ? 'primary.main' : 'text.secondary'}
                        >
                          #{entry.rank}
                        </Typography>

                        <Box>
                          <Typography variant="body1" fontWeight={700}>
                            {entry.name}
                            {entry.isCurrentUser ? ' (you)' : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.solvedWords} words found
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" fontWeight={700}>
                          {entry.score}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>

              {currentUserEntry && (
                <Box
                  sx={{
                    pt: 1.5,
                    mt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr auto',
                      alignItems: 'center',
                      gap: 2,
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      backgroundColor: 'action.selected',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      #{currentUserEntry.rank}
                    </Typography>

                    <Box>
                      <Typography variant="body1" fontWeight={700}>
                        {currentUserEntry.name} (you)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentUserEntry.solvedWords} words found
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" fontWeight={700}>
                      {currentUserEntry.score}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Desktop Sidebar Calendar */}
        {isDesktop && (
          <Box
            sx={{
              width: 300,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              p: 2,
              alignSelf: 'flex-start',
            }}
          >
            {renderCalendarContent()}
          </Box>
        )}

        {/* Mobile Popover Calendar */}
        {!isDesktop && (
          <Popover
            open={calendarOpen}
            anchorEl={calendarAnchor}
            onClose={handleCloseCalendar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{ sx: { p: 2, width: 320, borderRadius: 3 } }}
          >
            {renderCalendarContent()}
          </Popover>
        )}
      </Box>
    </Box>
  );
}

export default Leaderboard;
