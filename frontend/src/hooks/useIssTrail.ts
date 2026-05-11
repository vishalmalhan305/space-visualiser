import { useState } from 'react';
import { useIssPosition } from './useIssPosition';

const MAX_TRAIL = 20;
const DEDUP_THRESHOLD = 0.001;

interface TrailState {
  trail: [number, number][];
  lastPos: [number, number] | null;
}

export function useIssTrail() {
  const result = useIssPosition();
  const [state, setState] = useState<TrailState>({ trail: [], lastPos: null });

  const current = result.data;

  // React "adjust state during render" pattern — safe alternative to useEffect + setState.
  // React re-renders immediately with the new state when setState is called here conditionally.
  if (current) {
    const { lastPos } = state;
    const isNew =
      !lastPos ||
      Math.abs(current.latitude - lastPos[0]) > DEDUP_THRESHOLD ||
      Math.abs(current.longitude - lastPos[1]) > DEDUP_THRESHOLD;

    if (isNew) {
      const newPos: [number, number] = [current.latitude, current.longitude];
      setState(prev => ({
        trail: [...prev.trail.slice(-(MAX_TRAIL - 1)), newPos],
        lastPos: newPos,
      }));
    }
  }

  return {
    trail: state.trail,
    current,
    isLoading: result.isLoading,
    isError: result.isError,
    dataUpdatedAt: result.dataUpdatedAt,
    refetch: result.refetch,
  };
}
