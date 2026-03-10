import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Game from './Game';
import { GameMode } from '@/constants/game';
import * as wordService from '@/api/wordService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

vi.mock('@/api/wordService');

describe('Game Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Game plate="LPG" solutionsCount={10} goalPoints={100} mode={GameMode.DAILY} />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/LPG/i)).toBeInTheDocument();

    const scoreElements = screen.getAllByText(/0.*\/.*100/i);
    expect(scoreElements[0]).toBeInTheDocument();
  });

  it('updates points and adds a solution on a valid guess', async () => {
    vi.mocked(wordService.checkWordValidity).mockResolvedValue({
      is_valid: true,
      points: 10,
      message: 'Great job!',
    });

    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <Game plate="LPG" solutionsCount={10} goalPoints={100} mode={GameMode.DAILY} />
      </QueryClientProvider>,
    );

    await user.keyboard('LEAPFROG{Enter}');

    await waitFor(() => {
      const elements = screen.getAllByText(/Leapfrog/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const elements = screen.getAllByText(/10.*\/.*100/i);
      expect(elements[0]).toBeInTheDocument();
    });
  });

  it('prevents duplicate API calls for the same word', async () => {
    const user = userEvent.setup();

    // Mock the API to return a success
    vi.mocked(wordService.checkWordValidity).mockResolvedValue({
      is_valid: true,
      points: 10,
      message: 'Great job!',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Game plate="LPG" solutionsCount={10} goalPoints={100} mode={GameMode.DAILY} />
      </QueryClientProvider>,
    );

    // This wipes any calls that happened during initial mount/render
    vi.mocked(wordService.checkWordValidity).mockClear();

    await user.keyboard('LIMPING{Enter}');

    await waitFor(() => {
      const elements = screen.getAllByText(/Limping/i);
      expect(elements.length).toBeGreaterThan(0);
    });
    expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);

    await user.keyboard('LIMPING{Enter}');

    expect(wordService.checkWordValidity).toHaveBeenCalledTimes(1);

    expect(await screen.findByText(/Already found/i)).toBeInTheDocument();
  });

  it('displays an error message when the API call fails', async () => {
    const user = userEvent.setup();

    vi.mocked(wordService.checkWordValidity).mockRejectedValue(new Error('Network Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <Game plate="LPG" solutionsCount={10} goalPoints={100} mode={GameMode.DAILY} />
      </QueryClientProvider>,
    );

    await user.keyboard('FAIL{Enter}');

    expect(
      await screen.findByText(/An error occurred while checking your guess/i),
    ).toBeInTheDocument();
  });
});
