import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    // Replace 'License Plate Game' with whatever text is actually in your App
    const heading = screen.getByText(/license plate game/i);
    expect(heading).toBeInTheDocument();
  });
});
