import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { MarsPhoto, MarsFilters } from '../types/mars';

export function useMarsPhotos(filters: MarsFilters) {
  return useQuery<MarsPhoto[], Error>({
    queryKey: ['marsPhotos', filters.rover],
    queryFn: async () => {
      const response = await api.get<MarsPhoto[]>(
        ENDPOINTS.MARS.PHOTOS(filters.rover)
      );
      return response.data;
    },
    enabled: !!filters.rover,
    staleTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
