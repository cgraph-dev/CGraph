/**
 * useFrequencies — TanStack queries for topic/frequency management
 *
 * @module modules/discovery/hooks/useFrequencies
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Topic {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface UserFrequency {
  topic_id: string;
  weight: number;
  topic: Topic;
}

/** Fetch all available discovery topics */
export function useTopics() {
  return useQuery<Topic[]>({
    queryKey: ['discovery', 'topics'],
    queryFn: async () => {
      const res = await api.get('/api/v1/topics');
       
      return res.data.data as Topic[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Fetch current user's frequency weights */
export function useUserFrequencies() {
  return useQuery<UserFrequency[]>({
    queryKey: ['discovery', 'frequencies'],
    queryFn: async () => {
      const res = await api.get('/api/v1/frequencies');
       
      return res.data.data as UserFrequency[];
    },
    staleTime: 60_000,
  });
}

/** Mutation to update frequency weights */
export function useUpdateFrequencies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frequencies: Array<{ topic_id: string; weight: number }>) => {
      const res = await api.put('/api/v1/frequencies', { frequencies });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery', 'frequencies'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
