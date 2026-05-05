import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AsteroidTracker } from './AsteroidTracker';
import * as asteroidHooks from '../../hooks/useAsteroids';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Asteroid } from '../../types/dashboard';

function mockQuery(partial: { data: Asteroid[] | undefined; isLoading: boolean }) {
  return partial as unknown as UseQueryResult<Asteroid[], Error>;
}

vi.mock('../../hooks/useAsteroids', () => ({
  useAsteroidsWeek: vi.fn(),
}));

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderTracker(client = makeClient()) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <AsteroidTracker />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const criticalAsteroid = {
  neoId: '1',
  name: 'Killer Asteroid',
  estDiameterKmMin: 1.0,
  estDiameterKmMax: 2.0,
  potentiallyHazardous: true,
  closeApproachDate: '2026-05-01',
  velocity_kmh: 50000,
  missDistanceKm: 1_000_000, // < 7.5M km threshold → CRITICAL
};

const safeAsteroid = {
  neoId: '2',
  name: 'Safe Rock',
  estDiameterKmMin: 0.1,
  estDiameterKmMax: 0.2,
  potentiallyHazardous: false,
  closeApproachDate: '2026-05-02',
  velocity_kmh: 20000,
  missDistanceKm: 50_000_000,
};

const warningAsteroid = {
  neoId: '3',
  name: 'Warning Rock',
  estDiameterKmMin: 0.5,
  estDiameterKmMax: 1.0,
  potentiallyHazardous: true,
  closeApproachDate: '2026-05-03',
  velocity_kmh: 30000,
  missDistanceKm: 10_000_000, // > 7.5M km → HAZARD (not CRITICAL)
};

describe('AsteroidTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel heading', () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({ data: undefined, isLoading: true }));
    renderTracker();
    expect(screen.getByText(/Near-Earth Objects/i)).toBeInTheDocument();
  });

  it('shows skeleton rows while loading', () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({ data: undefined, isLoading: true }));
    renderTracker();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders asteroid name and count badge when data loads', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [criticalAsteroid],
      isLoading: false,
    }));
    renderTracker();
    expect(await screen.findByText(/Killer Asteroid/i)).toBeInTheDocument();
    expect(screen.getByText(/7D: 1/i)).toBeInTheDocument();
  });

  it('shows RISK badge when hazardous asteroids exist', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [criticalAsteroid],
      isLoading: false,
    }));
    renderTracker();
    expect(await screen.findByText(/1 RISK/i)).toBeInTheDocument();
  });

  it('hides RISK badge when no hazardous asteroids', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [safeAsteroid],
      isLoading: false,
    }));
    renderTracker();
    await screen.findByText(/Safe Rock/i);
    expect(screen.queryByText(/RISK/i)).not.toBeInTheDocument();
  });

  it('labels a close hazardous asteroid as CRITICAL', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [criticalAsteroid],
      isLoading: false,
    }));
    renderTracker();
    expect(await screen.findByText(/CRITICAL/i)).toBeInTheDocument();
  });

  it('labels a far hazardous asteroid as HAZARD', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [warningAsteroid],
      isLoading: false,
    }));
    renderTracker();
    expect(await screen.findByText(/HAZARD/i)).toBeInTheDocument();
  });

  it('labels a non-hazardous asteroid as NOMINAL', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [safeAsteroid],
      isLoading: false,
    }));
    renderTracker();
    expect(await screen.findByText(/NOMINAL/i)).toBeInTheDocument();
  });

  it('shows empty state message when list is empty', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({ data: [], isLoading: false }));
    renderTracker();
    expect(await screen.findByText(/No objects detected this week/i)).toBeInTheDocument();
  });

  it('opens orbit modal when a row is clicked', async () => {
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({
      data: [criticalAsteroid],
      isLoading: false,
    }));
    renderTracker();
    const row = await screen.findByText(/Killer Asteroid/i);
    fireEvent.click(row);
    expect(screen.getByLabelText(/Track Killer Asteroid/i)).toBeInTheDocument();
  });

  it('caps the table at 5 rows when more data is returned', async () => {
    const asteroids = Array.from({ length: 8 }, (_, i) => ({
      ...safeAsteroid,
      neoId: String(i),
      name: `Rock ${i}`,
    }));
    vi.mocked(asteroidHooks.useAsteroidsWeek).mockReturnValue(mockQuery({ data: asteroids, isLoading: false }));
    renderTracker();
    await screen.findByText(/Rock 0/i);
    expect(screen.queryByText(/Rock 5/i)).not.toBeInTheDocument();
  });
});
