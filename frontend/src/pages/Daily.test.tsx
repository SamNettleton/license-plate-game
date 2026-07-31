import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Daily from './Daily';
import * as plateService from '../api/plateService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock plateService API
vi.mock('../api/plateService', () => ({
  fetchDailyPlate: vi.fn(),
}));

// Mock Grafana Faro telemetry consumed by underlying Game component
vi.mock('@/App', () => ({
  faro: {
    api: {
      pushError: vi.fn(),
      pushLog: vi.fn(),
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Daily Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Data Loading and Rendering', () => {
    it('renders loading state initially and then displays the game on success', async () => {
      const mockDailyPlate = {
        sequence: 'DAY',
        solutionsCount: 10,
        goalPoints: 20,
      };
      (plateService.fetchDailyPlate as any).mockResolvedValue(mockDailyPlate);

      render(<Daily resultsOpen={false} />, { wrapper });

      expect(screen.getByText(/Crafting a daily plate/i)).toBeInTheDocument();

      const plateElement = await screen.findByText('DAY');
      expect(plateElement).toBeInTheDocument();

      expect(plateService.fetchDailyPlate).toHaveBeenCalledTimes(1);
    });

    it('renders error state when the API call fails', async () => {
      (plateService.fetchDailyPlate as any).mockRejectedValue(new Error('Network Error'));

      render(<Daily resultsOpen={false} />, { wrapper });

      const errorMsg = await screen.findByText(/Network Error/i);
      expect(errorMsg).toBeInTheDocument();
    });
  });

  describe('Modal Integration', () => {
    it('renders the game without crashing when resultsOpen is true', async () => {
      const mockDailyPlate = {
        sequence: 'LPG',
        solutionsCount: 15,
        goalPoints: 50,
      };
      (plateService.fetchDailyPlate as any).mockResolvedValue(mockDailyPlate);

      render(<Daily resultsOpen={true} />, { wrapper });

      const plateElement = await screen.findByText('LPG');
      expect(plateElement).toBeInTheDocument();
    });
  });
});
