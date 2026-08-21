import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsComparison from './StatsComparisonTable';
import { DailyStatMetrics } from '@/api/statsService';

const mockGlobalStats: DailyStatMetrics = {
  wordsFoundCount: 25,
  totalPoints: 150.5,
  avgWordLength: 4.8,
  minWordLength: 3,
  maxWordLength: 10,
};

const mockUserStats: DailyStatMetrics = {
  wordsFoundCount: 12,
  totalPoints: 85,
  avgWordLength: 5.2,
  minWordLength: 4,
  maxWordLength: 8,
};

describe('StatsComparison Component', () => {
  describe('Header Rendering', () => {
    it('renders column headers correctly', () => {
      render(
        <StatsComparison
          stats={{
            globalStats: mockGlobalStats,
            userStats: null,
          }}
        />,
      );

      expect(screen.getByText('YOU')).toBeInTheDocument();
      expect(screen.getByText('GLOBAL')).toBeInTheDocument();
    });

    it('renders all category labels and average sublabels', () => {
      render(
        <StatsComparison
          stats={{
            globalStats: mockGlobalStats,
            userStats: null,
          }}
        />,
      );

      expect(screen.getByText('Points')).toBeInTheDocument();
      expect(screen.getByText('Words Found')).toBeInTheDocument();
      expect(screen.getByText('Word Length')).toBeInTheDocument();
      expect(screen.getByText('Shortest')).toBeInTheDocument();
      expect(screen.getByText('Longest')).toBeInTheDocument();

      // Verify the three 'Average' sublabels are present
      const averageSublabels = screen.getAllByText('Average');
      expect(averageSublabels).toHaveLength(3);
    });
  });

  describe('Populated User Stats Rendering', () => {
    it('renders both user and global metric values accurately', () => {
      render(
        <StatsComparison
          stats={{
            globalStats: mockGlobalStats,
            userStats: mockUserStats,
          }}
        />,
      );

      // User stats values
      expect(screen.getByText('85')).toBeInTheDocument(); // Points
      expect(screen.getByText('12')).toBeInTheDocument(); // Words found
      expect(screen.getByText('5.2')).toBeInTheDocument(); // Avg length
      expect(screen.getByText('4')).toBeInTheDocument(); // Shortest word
      expect(screen.getByText('8')).toBeInTheDocument(); // Longest word

      // Global stats values
      expect(screen.getByText('150.5')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Null or Missing User Stats Handling', () => {
    it('renders dashes for all user metrics when userStats is null', () => {
      render(
        <StatsComparison
          stats={{
            globalStats: mockGlobalStats,
            userStats: null,
          }}
        />,
      );

      const dashes = screen.getAllByText('-');
      // Exactly 5 rows should render '-' for the 'YOU' column
      expect(dashes).toHaveLength(5);
    });
  });

  describe('Zero-Length Threshold Edge Cases', () => {
    it('renders dashes for min/max lengths when word length is 0', () => {
      const zeroLengthUser: DailyStatMetrics = {
        wordsFoundCount: 0,
        totalPoints: 0,
        avgWordLength: 0,
        minWordLength: 0,
        maxWordLength: 0,
      };

      const zeroLengthGlobal: DailyStatMetrics = {
        wordsFoundCount: 0,
        totalPoints: 0,
        avgWordLength: 0,
        minWordLength: 0,
        maxWordLength: 0,
      };

      render(
        <StatsComparison
          stats={{
            globalStats: zeroLengthGlobal,
            userStats: zeroLengthUser,
          }}
        />,
      );

      // Shortest & Longest for both YOU and GLOBAL should fall back to '-' (4 total dashes)
      const dashes = screen.getAllByText('-');
      expect(dashes).toHaveLength(4);

      // Words found, points, and avg length should render explicit '0's
      const zeroes = screen.getAllByText('0');
      expect(zeroes).toHaveLength(6);
    });
  });
});
