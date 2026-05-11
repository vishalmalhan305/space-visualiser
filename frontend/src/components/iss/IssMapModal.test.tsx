import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { IssMapModal } from './IssMapModal';
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

function renderModal(onClose = vi.fn()) {
  return render(
    <IssMapModal
      trail={[[51.23, -73.44]]}
      current={current}
      dataUpdatedAt={Date.now()}
      refetch={vi.fn()}
      onClose={onClose}
    />
  );
}

describe('IssMapModal', () => {
  it('renders the map', () => {
    renderModal();
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByRole('button', { name: /close iss map/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    // backdrop is the first fixed div with aria-hidden
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders all four stats', () => {
    renderModal();
    expect(screen.getAllByText(/altitude/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/velocity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/latitude/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/longitude/i).length).toBeGreaterThan(0);
  });
});
