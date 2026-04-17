import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { Asteroid } from '../types/dashboard';

export function useAsteroidsWeek() {
  return useQuery({
    queryKey: ['asteroids', 'week'],
    queryFn: async () => {
      const { data } = await api.get<Asteroid[]>(ENDPOINTS.ASTEROIDS.WEEK);
      return data;
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

export function useAsteroidDetails(id: string) {
  return useQuery({
    queryKey: ['asteroid', id],
    queryFn: async () => {
      const { data } = await api.get<Asteroid>(ENDPOINTS.ASTEROIDS.DETAILS(id));
      return data;
    },
    enabled: !!id,
  });
}

export function useAsteroidOrbit(id: string) {
  return useQuery({
    queryKey: ['asteroid', 'orbit', id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.ASTEROIDS.ORBIT(id));
      return data;
    },
    enabled: !!id,
  });
}
