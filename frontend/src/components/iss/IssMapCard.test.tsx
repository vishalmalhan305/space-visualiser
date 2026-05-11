import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { IssMapCard } from './IssMapCard';
import type { IssPosition } from '../../types/dashboard';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: () => null,
  Marker: () => null,
  useMap: () => ({ panTo: vi.fn(), invalidateSize: vi.fn() }),
}));

vi.mock('leaflet', () => ({
  divIcon: () => ({}),
}));

const current: IssPosition = {
  latitude: 51.23,
  longitude: -73.44,
  altitude_km: 420,
  velocity_km_h: 27600,
  timestamp: '',
};

describe('IssMapCard', () => {
  it('renders the map', () => {
    render(
      <IssMapCard
        trail={[[51.23, -73.44]]}
        current={current}
        isLoading={false}
        dataUpdatedAt={Date.now()}
        onExpand={vi.fn()}
      />
    );
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('calls onExpand when card is clicked', () => {
    const onExpand = vi.fn();
    render(
      <IssMapCard
        trail={[]}
        current={current}
        isLoading={false}
        dataUpdatedAt={0}
        onExpand={onExpand}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /expand iss map/i }));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('calls onExpand on Enter key', () => {
    const onExpand = vi.fn();
    render(
      <IssMapCard
        trail={[]}
        current={current}
        isLoading={false}
        dataUpdatedAt={0}
        onExpand={onExpand}
      />
    );
    fireEvent.keyDown(screen.getByRole('button', { name: /expand iss map/i }), { key: 'Enter' });
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('shows loading skeleton instead of map when isLoading', () => {
    render(
      <IssMapCard
        trail={[]}
        current={current}
        isLoading={true}
        dataUpdatedAt={0}
        onExpand={vi.fn()}
      />
    );
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });
});
