import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Daily from './Daily';
import * as plateService from '../api/plateService';
import { vi } from 'vitest';

vi.mock('../api/plateService', () => ({
  fetchDailyPlate: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Daily Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders loading state initially and then shows the daily game', async () => {
    const mockDailyPlate = {
      sequence: 'DAY',
      solutionsCount: 10,
      goalPoints: 20,
    };
    (plateService.fetchDailyPlate as any).mockResolvedValue(mockDailyPlate);

    render(<Daily />, { wrapper });

    expect(screen.getByText(/Crafting a daily plate/i)).toBeInTheDocument();

    const plateElement = await screen.findByText('DAY');
    expect(plateElement).toBeInTheDocument();

    expect(plateService.fetchDailyPlate).toHaveBeenCalledTimes(1);
  });

  it('renders error state when the API fails', async () => {
    (plateService.fetchDailyPlate as any).mockRejectedValue(new Error('Network Error'));

    render(<Daily />, { wrapper });

    const errorMsg = await screen.findByText(/Network Error/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
