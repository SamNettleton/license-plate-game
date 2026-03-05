import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';
import FeedbackDisplay from './FeedbackDisplay';
import { GameFeedback } from '@/types/game';

const renderWithTheme = (ui: React.ReactElement, mode: 'light' | 'dark') => {
  const theme = createTheme({
    palette: { mode },
    // This disables all CSS transitions globally in the theme for testing purposes,
    // ensuring that styles are applied immediately without waiting for animations
    // to complete.
    transitions: {
      create: () => 'none',
      duration: {
        shortest: 0,
        shorter: 0,
        short: 0,
        standard: 0,
        complex: 0,
        enteringScreen: 0,
        leavingScreen: 0,
      },
    },
  });
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('FeedbackDisplay Component', () => {
  it('returns null when feedback is null', () => {
    const { container } = render(<FeedbackDisplay feedback={null} />);
    expect(container.firstChild).toBeNull();
  });

  describe('Success Type', () => {
    const successFeedback: GameFeedback = { message: 'Correct!', type: 'success' };

    it('renders white background in both modes', async () => {
      // Light Mode check
      const { unmount } = renderWithTheme(<FeedbackDisplay feedback={successFeedback} />, 'light');
      let box = (await screen.findByText('Correct!')).closest('div');
      expect(box).toHaveStyle({ 'background-color': '#ffffff' });
      unmount();

      // Dark Mode check
      renderWithTheme(<FeedbackDisplay feedback={successFeedback} />, 'dark');
      box = (await screen.findByText('Correct!')).closest('div');
      expect(box).toHaveStyle({ 'background-color': '#ffffff' });
    });
  });

  describe('Info Type', () => {
    const infoFeedback: GameFeedback = { message: 'Already found', type: 'info' };

    it('renders dark charcoal (grey.900) background in light mode', async () => {
      renderWithTheme(<FeedbackDisplay feedback={infoFeedback} />, 'light');
      const box = (await screen.findByText('Already found')).closest('div');

      // rgb(33, 33, 33) is the standard value for MUI grey[900]
      expect(box).toHaveStyle({ 'background-color': 'rgb(33, 33, 33)' });
    });

    it('renders grey.800 background in dark mode', async () => {
      renderWithTheme(<FeedbackDisplay feedback={infoFeedback} />, 'dark');
      const box = (await screen.findByText('Already found')).closest('div');
      // grey[800] is rgb(66, 66, 66)
      expect(box).toHaveStyle({ 'background-color': 'rgb(66, 66, 66)' });
    });
  });

  describe('Error Type (Dull Red)', () => {
    const errorFeedback: GameFeedback = { message: 'Invalid word', type: 'error' };

    it('renders muted red in light mode (#c66b6b)', async () => {
      renderWithTheme(<FeedbackDisplay feedback={errorFeedback} />, 'light');
      const box = (await screen.findByText('Invalid word')).closest('div');
      expect(box).toHaveStyle({ 'background-color': 'rgb(198, 107, 107)' });
    });

    it('renders deeper red in dark mode (#9e4a4a)', async () => {
      renderWithTheme(<FeedbackDisplay feedback={errorFeedback} />, 'dark');
      const box = (await screen.findByText('Invalid word')).closest('div');
      expect(box).toHaveStyle({ 'background-color': 'rgb(158, 74, 74)' });
    });
  });
});
