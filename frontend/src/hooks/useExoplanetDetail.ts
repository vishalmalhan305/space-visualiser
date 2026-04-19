import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ExoplanetDetail } from '../types/exoplanet';

export function useExoplanetDetail(plName: string | null) {
  return useQuery({
    queryKey: ['exoplanet', 'detail', plName],
    queryFn: async () => {
      const { data } = await api.get<ExoplanetDetail>(ENDPOINTS.EXOPLANETS.DETAIL(plName!));
      return data;
    },
    enabled: !!plName,
    staleTime: 12 * 60 * 60 * 1000,
  });
}
