import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ExoplanetSummary } from '../types/exoplanet';

export function useExoplanets() {
  return useQuery({
    queryKey: ['exoplanets'],
    queryFn: async () => {
      const { data } = await api.get<ExoplanetSummary[]>(ENDPOINTS.EXOPLANETS.ALL);
      return data;
    },
    staleTime: 12 * 60 * 60 * 1000,
  });
}
