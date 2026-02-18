/**
 * StorageManagement - View and manage cached data/storage
 * Settings page for storage controls
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { entranceVariants, springs } from '@/lib/animation-presets/presets';
import {
  CircleStackIcon,
  TrashIcon,
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store/authStore.impl';

interface StorageBreakdown {
  messages: number; // bytes
  images: number;
  videos: number;
  documents: number;
  cache: number;
  total: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const CATEGORIES = [
  { key: 'messages', label: 'Messages', icon: ChatBubbleLeftIcon, color: 'bg-blue-500' },
  { key: 'images', label: 'Images', icon: PhotoIcon, color: 'bg-green-500' },
  { key: 'videos', label: 'Videos', icon: FilmIcon, color: 'bg-purple-500' },
  { key: 'documents', label: 'Documents', icon: DocumentIcon, color: 'bg-orange-500' },
  { key: 'cache', label: 'Cache', icon: CircleStackIcon, color: 'bg-gray-500' },
] as const;

type AutoDownloadOption = 'always' | 'wifi' | 'never';

export function StorageManagement() {
  const [storage, setStorage] = useState<StorageBreakdown>({
    messages: 0,
    images: 0,
    videos: 0,
    documents: 0,
    cache: 0,
    total: 0,
  });
  const [clearing, setClearing] = useState(false);
  const [autoDownload, setAutoDownload] = useState<{
    images: AutoDownloadOption;
    videos: AutoDownloadOption;
    documents: AutoDownloadOption;
  }>({
    images: 'always',
    videos: 'wifi',
    documents: 'never',
  });

  useEffect(() => {
    // Estimate storage usage from browser APIs
    const estimate = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        const used = est.usage || 0;
        // Rough breakdown (in practice you'd track per-category)
        setStorage({
          messages: Math.floor(used * 0.3),
          images: Math.floor(used * 0.35),
          videos: Math.floor(used * 0.2),
          documents: Math.floor(used * 0.05),
          cache: Math.floor(used * 0.1),
          total: used,
        });
      }
    };
    estimate();
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Clear service worker cache
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
      // Clear localStorage except auth token
      const token = useAuthStore.getState().token;
      localStorage.clear();
      if (token) localStorage.setItem('token', token);

      setStorage((prev) => ({ ...prev, cache: 0, total: prev.total - prev.cache }));
    } finally {
      setClearing(false);
    }
  };

  const maxCategory = Math.max(...Object.values(storage).filter((_, i) => i < 5));

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <CircleStackIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Storage & Data</h2>
        </div>
        <p className="text-sm text-white/40">Total usage: {formatBytes(storage.total)}</p>
      </motion.div>

      {/* Usage breakdown */}
      <div className="mb-8 space-y-3">
        {CATEGORIES.map((cat) => {
          const value = storage[cat.key as keyof StorageBreakdown];
          const pct = maxCategory > 0 ? (value / maxCategory) * 100 : 0;

          return (
            <div key={cat.key} className="flex items-center gap-3">
              <cat.icon className="h-5 w-5 text-white/40" />
              <div className="min-w-[80px] text-sm text-white/60">{cat.label}</div>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-dark-700">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${cat.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="min-w-[60px] text-right text-xs text-white/30">
                {formatBytes(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clear cache */}
      <div className="mb-8 rounded-xl border border-white/10 bg-dark-700/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Clear Cache</h3>
            <p className="text-xs text-white/30">Free up space by clearing cached data</p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearing}
            className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 hover:bg-red-600/30 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {clearing ? 'Clearing...' : 'Clear'}
          </button>
        </div>
      </div>

      {/* Auto-download settings */}
      <div className="rounded-xl border border-white/10 bg-dark-700/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Auto-Download</h3>
        <div className="space-y-3">
          {(['images', 'videos', 'documents'] as const).map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm capitalize text-white/60">{type}</span>
              <select
                value={autoDownload[type]}
                onChange={(e) =>
                  setAutoDownload((prev) => ({
                    ...prev,
                    [type]: e.target.value as AutoDownloadOption,
                  }))
                }
                className="rounded-lg border border-white/10 bg-dark-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="always">Always</option>
                <option value="wifi">Wi-Fi only</option>
                <option value="never">Never</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
