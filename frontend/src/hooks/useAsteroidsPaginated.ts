import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { Asteroid } from '../types/dashboard';

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export function useAsteroidsPaginated(page: number, size: number, hazardous?: boolean) {
  return useQuery({
    queryKey: ['asteroids', 'page', page, size, hazardous],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Asteroid>>(ENDPOINTS.ASTEROIDS.PAGE, {
        params: {
          page,
          size,
          hazardous: hazardous === undefined ? null : hazardous
        }
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
