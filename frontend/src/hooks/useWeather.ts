import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { SpaceWeatherEvent } from '../types/dashboard';

export function useRecentWeather(days: number = 7) {
  return useQuery({
    queryKey: ['weather', 'recent', days],
    queryFn: async () => {
      const { data } = await api.get<SpaceWeatherEvent[]>(ENDPOINTS.WEATHER.RECENT(days));
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
