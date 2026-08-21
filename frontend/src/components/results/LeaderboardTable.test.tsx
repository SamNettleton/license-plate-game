import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LeaderboardTable from './LeaderboardTable';
import { LeaderboardEntry } from '@/api/leaderboardService';

const mockEntries: LeaderboardEntry[] = [
  { rank: 1, name: 'Alice', score: 120, wordsFoundCount: 15, isCurrentUser: false },
  { rank: 2, name: 'Bob', score: 95, wordsFoundCount: 10, isCurrentUser: false },
];

const mockCurrentUser: LeaderboardEntry = {
  rank: 14,
  name: 'Sam',
  score: 40,
  wordsFoundCount: 5,
  isCurrentUser: true,
};

describe('LeaderboardTable Component', () => {
  describe('Empty State', () => {
    it('renders empty message when entries array is empty', () => {
      render(<LeaderboardTable entries={[]} />);
      expect(screen.getByText('No scores yet for this day.')).toBeInTheDocument();
    });
  });

  describe('Entries Rendering', () => {
    it('renders top entries list correctly', () => {
      render(<LeaderboardTable entries={mockEntries} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();

      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('highlights current user in top list if marked as isCurrentUser', () => {
      const entriesWithUser: LeaderboardEntry[] = [
        { rank: 1, name: 'Sam', score: 150, wordsFoundCount: 18, isCurrentUser: true },
      ];

      render(<LeaderboardTable entries={entriesWithUser} />);
      expect(screen.getByText('Sam (you)')).toBeInTheDocument();
    });
  });

  describe('Sticky Footer Current User Rendering', () => {
    it('renders pinned current user entry at bottom when passed', () => {
      render(<LeaderboardTable entries={mockEntries} currentUser={mockCurrentUser} />);

      expect(screen.getByText('#14')).toBeInTheDocument();
      expect(screen.getByText('Sam (you)')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
    });
  });
});
