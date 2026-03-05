import { render, screen } from '@testing-library/react';
import LoadingDisplay from './LoadingDisplay';

describe('LoadingDisplay Component', () => {
  describe('renders', () => {
    it('renders the circular progress spinner', () => {
      render(<LoadingDisplay />);

      // MUI CircularProgress has a role of 'progressbar'
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders the default loading message', () => {
      render(<LoadingDisplay />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders a custom loading message', () => {
      const customMessage = 'Baking a fresh plate...';
      render(<LoadingDisplay message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });
});
