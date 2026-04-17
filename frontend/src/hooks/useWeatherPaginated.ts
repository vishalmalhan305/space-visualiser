import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { SpaceWeatherEvent, SpaceWeatherEventType } from '../types/dashboard';
import type { PaginatedResponse } from './useAsteroidsPaginated';

export function useWeatherPaginated(page: number, size: number, type?: SpaceWeatherEventType) {
  return useQuery({
    queryKey: ['weather', 'page', page, size, type],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SpaceWeatherEvent>>(ENDPOINTS.WEATHER.PAGE, {
        params: {
          page,
          size,
          type: type === undefined ? null : type
        }
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
