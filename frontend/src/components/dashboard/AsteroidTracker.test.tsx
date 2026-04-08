import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AsteroidTracker } from './AsteroidTracker';
import { asteroidService } from '../../services/asteroidService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the service
vi.mock('../../services/asteroidService', () => ({
  asteroidService: {
    getWeeklySummary: vi.fn(),
  },
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
    (asteroidService.getWeeklySummary as any).mockReturnValue(new Promise(() => {}));
    render(
      <QueryClientProvider client={queryClient}>
        <AsteroidTracker />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Near-Earth Objects/i)).toBeInTheDocument();
  });

  it('renders asteroid data correctly', async () => {
    const mockData = {
      element_count: 10,
      hazardous_count: 1,
      asteroids: [
        {
          id: '1',
          name: 'Killer Asteroid',
          estimated_diameter_km: 1.5,
          is_potentially_hazardous: true,
          close_approach_date: '2026-05-01',
          relative_velocity_km_h: 50000,
          miss_distance_km: 1000000,
        },
      ],
    };

    (asteroidService.getWeeklySummary as any).mockResolvedValue(mockData);

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
