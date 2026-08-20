import * as React from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@/material-ui';
import type { SxProps, Theme } from '@/material-ui';
import { ArrowBackIcon, ArrowForwardIcon } from '@/icons';
import { formatDateKey, addDays, startOfMonth, daysInMonth } from '@/utils/date';

export interface CalendarProps {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  onSelectDate: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
}) => {
  const monthLabel = selectedDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = React.useMemo(() => formatDateKey(new Date()), []);

  const isPrevMonthDisabled = startOfMonth(selectedDate) <= startOfMonth(minDate);
  const isNextMonthDisabled = startOfMonth(selectedDate) >= startOfMonth(maxDate);

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const totalCells = Math.ceil((daysInMonth(selectedDate) + firstWeekday) / 7) * 7;
    const cells: Array<{
      date: Date;
      inMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    for (let index = 0; index < totalCells; index += 1) {
      const currentDate = addDays(monthStart, index - firstWeekday);
      const formattedKey = formatDateKey(currentDate);
      const inMonth = currentDate.getMonth() === selectedDate.getMonth();
      const isSelected = formattedKey === formatDateKey(selectedDate);
      const isToday = formattedKey === todayKey;
      const isDisabled = currentDate < minDate || currentDate > maxDate;

      cells.push({ date: currentDate, inMonth, isSelected, isToday, isDisabled });
    }

    return cells;
  }, [selectedDate, minDate, maxDate, todayKey]);

  const moveByMonth = (amount: number) => {
    const targetMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, 1);
    if (targetMonth < minDate) {
      onSelectDate(minDate);
    } else if (targetMonth > maxDate) {
      onSelectDate(maxDate);
    } else {
      onSelectDate(targetMonth);
    }
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
        {calendarDays.map(({ date, inMonth, isSelected, isToday, isDisabled }) => (
          <Button
            key={formatDateKey(date)}
            size="small"
            disabled={isDisabled}
            onClick={() => onSelectDate(date)}
            sx={getDayButtonStyles({ isSelected, isToday, inMonth, isDisabled })}
          >
            {date.getDate()}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

// Extracted Styles
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
}

const getDayButtonStyles = ({
  isSelected,
  isToday,
  inMonth,
  isDisabled,
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
    minWidth: 0,
    p: 0,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    fontWeight: isToday || isSelected ? 700 : 400,
    color,
    outline,
    outlineOffset,
    bgcolor: isSelected ? 'primary.main' : 'transparent',
    '&:hover': {
      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
    },
  };
};
