import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Faro SDK initialization to prevent side-effects during integration testing
vi.mock('@grafana/faro-web-sdk', () => ({
  initializeFaro: vi.fn(() => ({
    api: {
      pushError: vi.fn(),
      pushLog: vi.fn(),
    },
  })),
  getWebInstrumentations: vi.fn(() => []),
}));

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText(/license plate game/i);
    expect(heading).toBeInTheDocument();
  });
});
