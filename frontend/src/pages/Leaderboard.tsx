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
} from '@/material-ui';
import {
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDateKey, toDateOnly, addDays, getLatestActiveGlobalDate } from '@/utils/date';
import { EARLIEST_ACTIVE_DATE } from '@/constants/date';
import { useSettings } from '@/context/SettingsContext';
import { fetchDailyLeaderboard, type LeaderboardResponse } from '@/api/leaderboardService';
import { Calendar } from '@/components/common/Calendar';
import LoadingDisplay from '@/components/feedback/LoadingDisplay';

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

  const handleSelectDate = (date: Date) => {
    if (date < minActiveDate || date > maxActiveDate) return;
    setSelectedDate(toDateOnly(date));
    handleCloseCalendar();
  };

  const moveByDays = (amount: number) => {
    setSelectedDate((current) => {
      const next = addDays(current, amount);
      if (next < minActiveDate) return minActiveDate;
      if (next > maxActiveDate) return maxActiveDate;
      return next;
    });
    handleCloseCalendar();
  };

  const selectedDateKey = formatDateKey(selectedDate);

  const {
    data: leaderboard = { entries: [], currentUser: undefined },
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<LeaderboardResponse>({
    queryKey: ['dailyLeaderboard', selectedDateKey, settings.playerId],
    queryFn: () => fetchDailyLeaderboard(selectedDateKey, settings.playerId, 10),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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

  return (
    <Box sx={pageContainerStyles}>
      <Box sx={contentLayoutStyles}>
        {/* Main Leaderboard Card */}
        <Box sx={leaderboardCardStyles}>
          {/* Header Row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Leaderboard
            </Typography>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                aria-label="refresh leaderboard"
                onClick={() => void refetch()}
                disabled={isLoading || isFetching}
                size="small"
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: isFetching ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>

              {!isDesktop && (
                <IconButton aria-label="pick date" color="primary" onClick={handleOpenCalendar}>
                  <CalendarIcon />
                </IconButton>
              )}
            </Stack>
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

            <Box component="button" onClick={handleOpenCalendar} sx={dateSelectorButtonStyles}>
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
            <Box sx={centeredContainerStyles}>
              <LoadingDisplay message="Loading leaderboard..." />
            </Box>
          ) : error ? (
            <Box sx={errorStateContainerStyles}>
              <Typography variant="body1" color="text.secondary">
                Unable to load the leaderboard for this day.
              </Typography>
              <Button variant="contained" onClick={() => void refetch()} sx={{ mt: 2 }}>
                Retry
              </Button>
            </Box>
          ) : (
            <Box sx={leaderboardBodyStyles}>
              <Box sx={entriesListScrollStyles}>
                {leaderboardEntries.length === 0 ? (
                  <Box sx={centeredContainerStyles}>
                    <Typography variant="body1" color="text.secondary">
                      No scores yet for this day.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {leaderboardEntries.map((entry) => (
                      <Box
                        key={`${entry.name}-${entry.rank}`}
                        sx={getEntryRowStyles(entry.isCurrentUser)}
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
                            {entry.wordsFoundCount} words found
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" fontWeight={700}>
                          {entry.score}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              {currentUserEntry && (
                <Box sx={stickyCurrentUserFooterStyles}>
                  <Box sx={getEntryRowStyles(true)}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      #{currentUserEntry.rank}
                    </Typography>

                    <Box>
                      <Typography variant="body1" fontWeight={700}>
                        {currentUserEntry.name} (you)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentUserEntry.wordsFoundCount} words found
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
          <Box sx={desktopSidebarStyles}>
            <Calendar
              selectedDate={selectedDate}
              minDate={minActiveDate}
              maxDate={maxActiveDate}
              onSelectDate={handleSelectDate}
            />
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
            slotProps={{ paper: { sx: popoverPaperStyles } }}
          >
            <Calendar
              selectedDate={selectedDate}
              minDate={minActiveDate}
              maxDate={maxActiveDate}
              onSelectDate={handleSelectDate}
            />
          </Popover>
        )}
      </Box>
    </Box>
  );
}

const pageContainerStyles = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  p: { xs: 2, sm: 3 },
};

const contentLayoutStyles = {
  width: '100%',
  maxWidth: 1200,
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: 3,
};

const leaderboardCardStyles = {
  flex: 1,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'background.paper',
  p: { xs: 2, sm: 3 },
  display: 'flex',
  flexDirection: 'column',
  minHeight: 400,
};

const dateSelectorButtonStyles = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center',
  p: 0.5,
  borderRadius: 1,
  '&:hover': { bgcolor: 'action.hover' },
};

const centeredContainerStyles = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
};

const errorStateContainerStyles = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  py: 4,
};

const leaderboardBodyStyles = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  position: 'relative',
};

const entriesListScrollStyles = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  maxHeight: { xs: '50vh', md: '500px' },
  overflowY: 'auto',
  pr: 1,
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'action.focus',
    borderRadius: '3px',
  },
};

const stickyCurrentUserFooterStyles = {
  pt: 1.5,
  mt: 1,
  borderTop: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
};

const desktopSidebarStyles = {
  width: 300,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'background.paper',
  p: 2,
  alignSelf: 'flex-start',
};

const popoverPaperStyles = {
  p: 2,
  width: 320,
  borderRadius: 3,
};

const getEntryRowStyles = (isCurrentUser?: boolean) => ({
  display: 'grid',
  gridTemplateColumns: '44px 1fr auto',
  alignItems: 'center',
  gap: 2,
  px: 1.5,
  py: 1,
  borderRadius: 2,
  border: '1px solid',
  borderColor: isCurrentUser ? 'primary.main' : 'transparent',
  backgroundColor: isCurrentUser ? 'action.selected' : 'transparent',
});

export default Leaderboard;
