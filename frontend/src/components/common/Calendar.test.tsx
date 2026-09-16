import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Calendar, DayStatus } from './Calendar';

describe('Calendar', () => {
  const mockOnSelectDate = vi.fn();
  const mockOnMonthChange = vi.fn();
  const mockGetDayStatus = vi.fn();

  const selectedDate = new Date(2026, 4, 15); // May 15, 2026
  const minDate = new Date(2026, 4, 1); // May 1, 2026
  const maxDate = new Date(2026, 4, 31); // May 31, 2026

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the correct month and year header label', () => {
      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      expect(screen.getByText('May 2026')).toBeInTheDocument();
    });

    it('renders Monday through Sunday weekday column headers', () => {
      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      const weekdayHeaders = screen.getAllByText(/^[MTWFS]$/);
      expect(weekdayHeaders).toHaveLength(7);
    });
  });

  describe('Date Selection', () => {
    it('triggers onSelectDate with the clicked date object when enabled', () => {
      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      const day20Button = screen.getByRole('button', { name: '20' });
      expect(day20Button).not.toBeDisabled();

      fireEvent.click(day20Button);

      expect(mockOnSelectDate).toHaveBeenCalledTimes(1);
      expect(mockOnSelectDate).toHaveBeenCalledWith(new Date(2026, 4, 20));
    });

    it('does not trigger onSelectDate when clicking a disabled date button', () => {
      const strictMinDate = new Date(2026, 4, 10);

      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={strictMinDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      const disabledDayButton = screen.getByRole('button', { name: '5' });
      expect(disabledDayButton).toBeDisabled();

      fireEvent.click(disabledDayButton);

      expect(mockOnSelectDate).not.toHaveBeenCalled();
    });

    it('updates viewDate when selectedDate prop changes externally', () => {
      const { rerender } = render(
        <Calendar
          selectedDate={selectedDate}
          minDate={new Date(2026, 3, 1)}
          maxDate={new Date(2026, 5, 30)}
          onSelectDate={mockOnSelectDate}
        />,
      );

      expect(screen.getByText('May 2026')).toBeInTheDocument();

      const newSelectedDate = new Date(2026, 5, 10); // June 10, 2026
      rerender(
        <Calendar
          selectedDate={newSelectedDate}
          minDate={new Date(2026, 3, 1)}
          maxDate={new Date(2026, 5, 30)}
          onSelectDate={mockOnSelectDate}
        />,
      );

      expect(screen.getByText('June 2026')).toBeInTheDocument();
    });
  });

  describe('Date Range Constraints', () => {
    it('disables day buttons strictly outside minDate and maxDate', () => {
      const strictMinDate = new Date(2026, 4, 10);
      const strictMaxDate = new Date(2026, 4, 20);

      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={strictMinDate}
          maxDate={strictMaxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      expect(screen.getByRole('button', { name: '9' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '10' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '20' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '21' })).toBeDisabled();
    });
  });

  describe('Month Navigation', () => {
    it('disables navigation buttons at min and max month limits', () => {
      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      expect(screen.getByRole('button', { name: 'previous month' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'next month' })).toBeDisabled();
    });

    it('updates viewed month and invokes onMonthChange when navigating backward', () => {
      const wideMin = new Date(2026, 3, 1); // April 1
      const wideMax = new Date(2026, 5, 30); // June 30

      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={wideMin}
          maxDate={wideMax}
          onSelectDate={mockOnSelectDate}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const prevButton = screen.getByRole('button', { name: 'previous month' });
      expect(prevButton).not.toBeDisabled();

      fireEvent.click(prevButton);

      expect(screen.getByText('April 2026')).toBeInTheDocument();
      expect(mockOnSelectDate).not.toHaveBeenCalled();
      expect(mockOnMonthChange).toHaveBeenCalledTimes(1);
      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 3, 1));
    });

    it('updates viewed month and invokes onMonthChange when navigating forward', () => {
      render(
        <Calendar
          selectedDate={new Date(2026, 3, 10)} // April 10
          minDate={new Date(2026, 3, 1)}
          maxDate={new Date(2026, 5, 5)} // June 5
          onSelectDate={mockOnSelectDate}
          onMonthChange={mockOnMonthChange}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'next month' });
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);

      expect(screen.getByText('May 2026')).toBeInTheDocument();
      expect(mockOnSelectDate).not.toHaveBeenCalled();
      expect(mockOnMonthChange).toHaveBeenCalledTimes(1);
      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2026, 4, 1));
    });
  });

  describe('Day Status & Emojis', () => {
    it('queries getDayStatus for formatted date keys and renders emojis when present', () => {
      mockGetDayStatus.mockImplementation((dateKey: string): DayStatus | undefined => {
        if (dateKey === '2026-05-15') {
          return { emoji: '🔥' };
        }
        if (dateKey === '2026-05-18') {
          return { emoji: '⭐' };
        }
        return undefined;
      });

      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
          getDayStatus={mockGetDayStatus}
        />,
      );

      expect(mockGetDayStatus).toHaveBeenCalled();
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('does not render emojis for days outside the current month', () => {
      mockGetDayStatus.mockImplementation((dateKey: string) => {
        // April 27, 2026 is an offset day rendered in May view
        if (dateKey === '2026-04-27') {
          return { emoji: '🎉' };
        }
        return undefined;
      });

      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={new Date(2026, 3, 1)}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
          getDayStatus={mockGetDayStatus}
        />,
      );

      expect(screen.queryByText('🎉')).not.toBeInTheDocument();
    });
  });

  describe('Grid & Layout Calculations', () => {
    it('pads calendar grid with leading days from previous month to align with Monday start', () => {
      render(
        <Calendar
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={mockOnSelectDate}
        />,
      );

      const buttons = screen.getAllByRole('button');
      // 2 navigation arrows + 35 grid cells (5 full weeks of 7 days)
      const gridDayButtons = buttons.slice(2);
      expect(gridDayButtons).toHaveLength(35);

      // The first cell in the grid should be April 27
      expect(gridDayButtons[0]).toHaveTextContent('27');
    });
  });
});
