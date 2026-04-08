import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AsteroidTracker } from './AsteroidTracker';
import * as asteroidHooks from '../../hooks/useAsteroids';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useAsteroids', () => ({
  useAsteroidsWeek: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('AsteroidTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton initially', () => {
    (asteroidHooks.useAsteroidsWeek as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AsteroidTracker />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Near-Earth Objects/i)).toBeInTheDocument();
  });

  it('renders asteroid data correctly', async () => {
    const mockData = [
      {
        neoId: '1',
        name: 'Killer Asteroid',
        estDiameterKmMin: 1.0,
        estDiameterKmMax: 2.0,
        potentiallyHazardous: true,
        closeApproachDate: '2026-05-01',
        velocity_kmh: 50000,
        missDistanceKm: 1000000,
      },
    ];

    (asteroidHooks.useAsteroidsWeek as any).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AsteroidTracker />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Killer Asteroid/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 Hazardous/i)).toBeInTheDocument();
    expect(await screen.findByText(/PHO/i)).toBeInTheDocument();
  });
});
