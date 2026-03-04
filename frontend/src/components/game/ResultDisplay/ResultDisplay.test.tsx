import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResultDisplay from './ResultDisplay';

describe('ResultDisplay Component', () => {
  it('shows "0 words" when no solutions found', () => {
    render(<ResultDisplay solutions={[]} />);
    expect(screen.getByText(/You have found 0 words/i)).toBeInTheDocument();
  });

  it('uses singular "word" for exactly 1 solution', () => {
    render(<ResultDisplay solutions={['leapfrog']} />);
    expect(screen.getByText(/You have found 1 word/i)).toBeInTheDocument();
    // Should NOT say "words"
    expect(screen.queryByText(/You have found 1 words/i)).not.toBeInTheDocument();
  });

  it('uses plural "words" for 2+ solutions', () => {
    render(<ResultDisplay solutions={['leapfrog', 'limping']} />);
    expect(screen.getByText(/You have found 2 words/i)).toBeInTheDocument();
  });

  it('renders each solution capitalized', () => {
    render(<ResultDisplay solutions={['leapfrog', 'limping']} />);
    expect(screen.getByText('Leapfrog')).toBeInTheDocument();
    expect(screen.getByText('Limping')).toBeInTheDocument();
  });

  it('renders all solutions when more than 10 are present', () => {
    const words = [
      'word1',
      'word2',
      'word3',
      'word4',
      'word5',
      'word6',
      'word7',
      'word8',
      'word9',
      'word10',
      'word11',
    ];
    render(<ResultDisplay solutions={words} />);
    expect(screen.getByText(/You have found 11 words/i)).toBeInTheDocument();
    // All words should be in the document
    words.forEach((w) => {
      const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
      expect(screen.getByText(capitalized)).toBeInTheDocument();
    });
  });
});
