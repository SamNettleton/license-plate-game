import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArchivePuzzleCard from '@/components/archive/ArchivePuzzleCard';

vi.mock('@/constants/game', () => ({
  getMilestone: () => ({ emoji: '🏆', label: 'Gold' }),
}));

describe('ArchivePuzzleCard', () => {
  const defaultProps = {
    date: new Date('2026-05-15T00:00:00Z'),
    sequence: 'ABC123',
    goalPoints: 100,
    pointsEarned: 75,
    wordsFound: ['word1', 'word2', 'word3'],
  };

  describe('Header & Metadata Display', () => {
    it('renders formatted date correctly', () => {
      render(<ArchivePuzzleCard {...defaultProps} />);
      const expectedDateStr = defaultProps.date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      expect(screen.getByText(expectedDateStr)).toBeInTheDocument();
    });

    it('renders sequence string inside the mini plate', () => {
      render(<ArchivePuzzleCard {...defaultProps} />);
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });

  describe('Score & Metrics Display', () => {
    it('displays score and goal points correctly', () => {
      render(<ArchivePuzzleCard {...defaultProps} />);
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('renders words found count correctly', () => {
      render(<ArchivePuzzleCard {...defaultProps} />);
      expect(screen.getByText('3 words found')).toBeInTheDocument();
    });
  });

  describe('Completion Status & Badges', () => {
    it('shows the milestone chip when points earned are greater than zero', () => {
      render(<ArchivePuzzleCard {...defaultProps} />);
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('shows "Not Played Yet" when points earned are zero', () => {
      render(<ArchivePuzzleCard {...defaultProps} pointsEarned={0} wordsFound={[]} />);
      expect(screen.getByText('Not Played Yet')).toBeInTheDocument();
      expect(screen.queryByText('Gold')).not.toBeInTheDocument();
      expect(screen.getByText('0 words found')).toBeInTheDocument();
    });
  });
});
