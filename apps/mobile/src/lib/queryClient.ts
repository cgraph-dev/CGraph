/**
 * React Query client setup with AsyncStorage persistence and network status integration.
 * @module lib/queryClient
 */
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: ONE_DAY_MS,
      retry: 2,
      retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 5_000),
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'cgraph-query-cache',
  throttleTime: 1000,
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: ONE_DAY_MS,
  buster: 'v0.9.31-mobile',
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});
