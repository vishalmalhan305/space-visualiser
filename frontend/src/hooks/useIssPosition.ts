import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { IssPosition } from '../types/dashboard';

export function useIssPosition() {
  return useQuery({
    queryKey: ['iss', 'position'],
    queryFn: async () => {
      const { data } = await api.get<IssPosition>(ENDPOINTS.ISS.POSITION);
      return data;
    },
    refetchInterval: 15000, // 15 seconds for live telemetry
  });
}
