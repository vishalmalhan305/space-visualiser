import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function useAiExplain(type: string, id: string, enabled = true) {
  return useQuery({
    queryKey: ['ai', 'explain', type, id],
    queryFn: async () => {
      const { data } = await api.get<{ explanation: string }>(ENDPOINTS.AI.EXPLAIN(type, id));
      return data.explanation;
    },
    enabled: enabled && !!type && !!id,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
