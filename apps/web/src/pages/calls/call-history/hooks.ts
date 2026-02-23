/**
 * Call history data fetching hooks.
 * @module
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CallRecord, CallFilter, CallSection } from './types';

/**
 * Formats seconds to human-readable duration.
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return 'No answer';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Formats a timestamp to relative time.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateSection(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (callDate.getTime() === today.getTime()) return 'Today';
  if (callDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Fallback data for demo / offline */
const FALLBACK_CALLS: CallRecord[] = [
  {
    id: '1',
    recipientId: 'user1',
    recipientName: 'Alice Johnson',
    type: 'video',
    direction: 'outgoing',
    duration: 1245,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    recipientId: 'user2',
    recipientName: 'Bob Smith',
    type: 'voice',
    direction: 'missed',
    duration: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    recipientId: 'user3',
    recipientName: 'Charlie Wilson',
    type: 'voice',
    direction: 'incoming',
    duration: 567,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    recipientId: 'user1',
    recipientName: 'Alice Johnson',
    type: 'video',
    direction: 'incoming',
    duration: 2134,
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: '5',
    recipientId: 'user4',
    recipientName: 'Diana Ross',
    type: 'voice',
    direction: 'outgoing',
    duration: 890,
    timestamp: new Date(Date.now() - 86_400_000 * 2).toISOString(),
  },
];

export function useCallHistory() {
  const [filter, setFilter] = useState<CallFilter>('all');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const {
    data: calls = FALLBACK_CALLS,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['call-history'],
    queryFn: async () => {
      const res = await api.get<{ data: CallRecord[] }>('/api/v1/calls/history');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30_000,
  });

  const filteredCalls = useMemo(() => {
    let result = calls.filter((c) => !deletedIds.has(c.id));
    if (filter === 'missed') {
      result = result.filter((c) => c.direction === 'missed');
    }
    return result;
  }, [calls, filter, deletedIds]);

  const sections = useMemo<CallSection[]>(() => {
    const groups: Record<string, CallRecord[]> = {};
    for (const call of filteredCalls) {
      const section = getDateSection(call.timestamp);
      if (!groups[section]) groups[section] = [];
      groups[section].push(call);
    }
    return Object.entries(groups).map(([title, sectionCalls]) => ({
      title,
      calls: sectionCalls,
    }));
  }, [filteredCalls]);

  const deleteCall = useCallback((callId: string) => {
    setDeletedIds((prev) => new Set(prev).add(callId));
  }, []);

  return {
    sections,
    filter,
    setFilter,
    deleteCall,
    isLoading,
    error,
    refetch,
    isEmpty: filteredCalls.length === 0,
  };
}
