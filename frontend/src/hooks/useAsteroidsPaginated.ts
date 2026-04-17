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

export interface AsteroidsQueryFilters {
  start?: string;
  end?: string;
  hazardous?: boolean;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export function useAsteroidsPaginated(page: number, size: number, filters: AsteroidsQueryFilters = {}) {
  return useQuery({
    queryKey: ['asteroids', 'page', page, size, filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Asteroid>>(ENDPOINTS.ASTEROIDS.PAGE, {
        params: {
          page,
          size,
          ...filters
        }
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
