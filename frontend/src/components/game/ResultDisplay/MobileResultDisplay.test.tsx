import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MobileResultDisplay from './MobileResultDisplay';

describe('MobileResultDisplay', () => {
  const mockSolutions = ['apple', 'banana', 'cherry'];
  const mockOnToggle = vi.fn();

  const setup = (solutions = mockSolutions) => {
    return render(<MobileResultDisplay solutions={solutions} onToggle={mockOnToggle} />);
  };

  describe('solutions', () => {
    it('renders solutions in collapsed state', () => {
      setup();
      expect(screen.getByText('Apple Banana Cherry')).toBeDefined();
    });

    it('renders solutions in a single column when 10 or fewer', () => {
      const mockSolutions = ['apple', 'banana']; // 2 solutions (<= 10)
      render(<MobileResultDisplay solutions={mockSolutions} onToggle={vi.fn()} />);

      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      const details = screen.getByRole('region', { name: /found solutions/i });

      expect(details).toHaveStyle({
        gridTemplateColumns: '1fr',
      });
    });

    it('renders solutions in two columns when more than 10', () => {
      const manySolutions = Array.from({ length: 11 }, (_, i) => `word${i}`);
      render(<MobileResultDisplay solutions={manySolutions} onToggle={vi.fn()} />);

      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      const details = screen.getByRole('region', { name: /found solutions/i });

      expect(details).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
      });
    });

    it('renders all solution items inside details when expanded', () => {
      setup();
      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      mockSolutions.forEach((word) => {
        const formattedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        const elements = screen.getAllByText(formattedWord);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('onToggle', () => {
    it('calls onToggle when clicked', () => {
      setup();
      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      expect(mockOnToggle).toHaveBeenCalledWith(true);

      fireEvent.click(summary);
      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('summaryText', () => {
    it('shows plural count text when expanded', () => {
      setup();
      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      expect(screen.getByText('You have found 3 words')).toBeDefined();
    });

    it('handles singular word grammar correctly', () => {
      setup(['apple']);
      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      expect(screen.getByText('You have found 1 word')).toBeDefined();
    });

    it('handles no solutions case', () => {
      setup([]);
      const summary = screen.getByRole('button');
      fireEvent.click(summary);

      expect(screen.getByText('You have found 0 words')).toBeDefined();
    });
  });
});
