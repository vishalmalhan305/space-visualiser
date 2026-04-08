import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { MarsPhoto, MarsFilters } from '../types/mars';

export function useMarsPhotos(filters: MarsFilters) {
  return useQuery<MarsPhoto[], Error>({
    queryKey: ['marsPhotos', filters.rover, filters.camera, filters.sol],
    queryFn: async () => {
      const response = await api.get<MarsPhoto[]>(
        ENDPOINTS.MARS.PHOTOS(filters.rover, filters.camera, filters.sol)
      );
      return response.data;
    },
    enabled: !!filters.rover && !!filters.camera && filters.sol !== undefined,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 Days in ms
    retry: 2,
    refetchOnWindowFocus: false, // Mars photos don't update frequently for historical sols
  });
}
