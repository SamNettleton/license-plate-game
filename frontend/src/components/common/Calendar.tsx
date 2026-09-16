import * as React from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@/material-ui';
import type { SxProps, Theme } from '@/material-ui';
import { ArrowBackIcon, ArrowForwardIcon } from '@/icons';
import { formatDateKey, addDays, startOfMonth, daysInMonth } from '@/utils/date';

export interface DayStatus {
  emoji?: string;
}

export interface CalendarProps {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange?: (newViewDate: Date) => void;
  getDayStatus?: (dateKey: string) => DayStatus | undefined;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
  onMonthChange,
  getDayStatus,
}) => {
  const [viewDate, setViewDate] = React.useState<Date>(selectedDate);

  React.useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  const monthLabel = viewDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = React.useMemo(() => formatDateKey(new Date()), []);

  const isPrevMonthDisabled = startOfMonth(viewDate) <= startOfMonth(minDate);
  const isNextMonthDisabled = startOfMonth(viewDate) >= startOfMonth(maxDate);

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const totalCells = Math.ceil((daysInMonth(viewDate) + firstWeekday) / 7) * 7;
    const cells: Array<{
      date: Date;
      formattedKey: string;
      inMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
      status?: DayStatus;
    }> = [];

    for (let index = 0; index < totalCells; index += 1) {
      const currentDate = addDays(monthStart, index - firstWeekday);
      const formattedKey = formatDateKey(currentDate);
      const inMonth = currentDate.getMonth() === viewDate.getMonth();
      const isSelected = formattedKey === formatDateKey(selectedDate);
      const isToday = formattedKey === todayKey;
      const isDisabled = currentDate < minDate || currentDate > maxDate;
      const status = getDayStatus?.(formattedKey);

      cells.push({
        date: currentDate,
        formattedKey,
        inMonth,
        isSelected,
        isToday,
        isDisabled,
        status,
      });
    }

    return cells;
  }, [viewDate, selectedDate, minDate, maxDate, todayKey, getDayStatus]);

  const moveByMonth = (amount: number) => {
    setViewDate((prev) => {
      const nextDate = new Date(prev.getFullYear(), prev.getMonth() + amount, 1);
      onMonthChange?.(nextDate);
      return nextDate;
    });
  };

  return (
    <Box sx={containerStyles}>
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

      <Box sx={weekdayGridStyles}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <Typography key={idx} variant="caption" color="text.secondary" fontWeight={700}>
            {day}
          </Typography>
        ))}
      </Box>

      <Box sx={daysGridStyles}>
        {calendarDays.map(
          ({ date, formattedKey, inMonth, isSelected, isToday, isDisabled, status }) => {
            const hasPlayed = Boolean(status?.emoji);

            return (
              <Box key={formattedKey} sx={{ position: 'relative', width: '100%' }}>
                <Button
                  size="small"
                  disabled={isDisabled}
                  onClick={() => onSelectDate(date)}
                  sx={getDayButtonStyles({
                    isSelected,
                    isToday,
                    inMonth,
                    isDisabled,
                    hasPlayed,
                  })}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      fontWeight: isToday || isSelected ? 700 : 400,
                      lineHeight: 1,
                      transform:
                        inMonth && !isDisabled && status?.emoji ? 'translateY(-3px)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {date.getDate()}
                  </Typography>

                  {inMonth && !isDisabled && status?.emoji && (
                    <Box
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 3,
                        fontSize: '0.625rem',
                        lineHeight: 1,
                        pointerEvents: 'none',
                      }}
                    >
                      {status.emoji}
                    </Box>
                  )}
                </Button>
              </Box>
            );
          },
        )}
      </Box>
    </Box>
  );
};

const containerStyles: SxProps<Theme> = {
  width: '100%',
};

const weekdayGridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 0.5,
  textAlign: 'center',
  mb: 1,
};

const daysGridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 0.5,
};

interface DayStyleParams {
  isSelected: boolean;
  isToday: boolean;
  inMonth: boolean;
  isDisabled: boolean;
  hasPlayed?: boolean;
}

const getDayButtonStyles = ({
  isSelected,
  isToday,
  inMonth,
  isDisabled,
  hasPlayed,
}: DayStyleParams): SxProps<Theme> => {
  let color = 'text.primary';
  if (isSelected) {
    color = 'primary.contrastText';
  } else if (isDisabled || !inMonth) {
    color = 'text.disabled';
  } else if (isToday) {
    color = 'primary.main';
  }

  let outline = 'none';
  let outlineOffset = '0px';
  if (isToday && !isSelected) {
    outline = '2px solid var(--mui-palette-primary-main)';
    outlineOffset = '-2px';
  }

  return {
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    height: 'auto',
    aspectRatio: '1 / 1',
    p: 0,
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    color,
    outline,
    outlineOffset,
    bgcolor: isSelected
      ? 'primary.main'
      : hasPlayed && inMonth && !isDisabled
        ? 'action.selected'
        : 'transparent',
    '&:hover': {
      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
    },
  };
};
