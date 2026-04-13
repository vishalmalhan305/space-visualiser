import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApodEntry } from '../types/apod';

export function useApodToday() {
  return useQuery({
    queryKey: ['apod', 'today'],
    queryFn: async () => {
      const { data } = await api.get<ApodEntry>(ENDPOINTS.APOD.TODAY);
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useApodByDate(date: string) {
  return useQuery({
    queryKey: ['apod', date],
    queryFn: async () => {
      const { data } = await api.get<ApodEntry>(ENDPOINTS.APOD.BY_DATE(date));
      return data;
    },
    enabled: !!date,
  });
}

export function useApodRange(start: string, end: string) {
  return useQuery({
    queryKey: ['apod', 'range', start, end],
    queryFn: async () => {
      const { data } = await api.get<ApodEntry[]>(ENDPOINTS.APOD.RANGE(start, end));
      return data;
    },
    enabled: !!start && !!end,
  });
}

export function useApodArchive(count: number = 30) {
  return useQuery({
    queryKey: ['apod', 'archive', count],
    queryFn: async () => {
      const { data } = await api.get<ApodEntry[]>(ENDPOINTS.APOD.ARCHIVE(count));
      return data;
    },
  });
}
