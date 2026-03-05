import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorDisplay from './ErrorDisplay';

describe('ErrorDisplay Component', () => {
  describe('error', () => {
    it('renders the custom error message', () => {
      const customError = new Error('Connection Timeout');
      render(<ErrorDisplay error={customError} reset={() => {}} />);

      expect(screen.getByText('Connection Timeout')).toBeInTheDocument();
    });

    it('renders a fallback message if error is null or has no message', () => {
      render(<ErrorDisplay error={null} reset={() => {}} />);

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('reset,', () => {
    it('calls the reset function when the "Try Again" button is clicked', () => {
      const resetMock = vi.fn();
      render(<ErrorDisplay error={new Error('Failed')} reset={resetMock} />);

      const button = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(button);

      expect(resetMock).toHaveBeenCalledTimes(1);
    });

    it('does not render the button if reset prop is missing', () => {
      // @ts-ignore - testing runtime behavior without the prop
      render(<ErrorDisplay error={new Error('Failed')} reset={undefined} />);

      const button = screen.queryByRole('button', { name: /try again/i });
      expect(button).not.toBeInTheDocument();
    });
  });
});
