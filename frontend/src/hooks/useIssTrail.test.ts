import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useIssTrail } from './useIssTrail';
import * as useIssPositionModule from './useIssPosition';
import type { UseQueryResult } from '@tanstack/react-query';
import type { IssPosition } from '../types/dashboard';

function makePosition(lat: number, lon: number): IssPosition {
  return { latitude: lat, longitude: lon, altitude_km: 420, velocity_km_h: 27600, timestamp: '' };
}

function mockQuery(data: IssPosition | undefined): UseQueryResult<IssPosition, Error> {
  return {
    data,
    isLoading: false,
    isError: false,
    dataUpdatedAt: Date.now(),
    refetch: vi.fn(),
  } as unknown as UseQueryResult<IssPosition, Error>;
}

vi.mock('./useIssPosition', () => ({ useIssPosition: vi.fn() }));

beforeEach(() => {
  vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(mockQuery(undefined));
});

describe('useIssTrail', () => {
  it('accumulates distinct positions', () => {
    const { result, rerender } = renderHook(() => useIssTrail());

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(10, 20))
      );
    });
    rerender();

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(11, 21))
      );
    });
    rerender();

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(12, 22))
      );
    });
    rerender();

    expect(result.current.trail.length).toBe(3);
  });

  it('deduplicates identical positions', () => {
    const { result, rerender } = renderHook(() => useIssTrail());

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(10, 20))
      );
    });
    rerender();

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(10, 20))
      );
    });
    rerender();

    expect(result.current.trail.length).toBe(1);
  });

  it('caps trail at 20 positions', () => {
    const { result, rerender } = renderHook(() => useIssTrail());

    for (let i = 0; i < 25; i++) {
      act(() => {
        vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
          mockQuery(makePosition(i, i))
        );
      });
      rerender();
    }

    expect(result.current.trail.length).toBe(20);
  });

  it('preserves trail when data is undefined', () => {
    const { result, rerender } = renderHook(() => useIssTrail());

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(
        mockQuery(makePosition(10, 20))
      );
    });
    rerender();

    act(() => {
      vi.mocked(useIssPositionModule.useIssPosition).mockReturnValue(mockQuery(undefined));
    });
    rerender();

    expect(result.current.trail.length).toBe(1);
  });
});
