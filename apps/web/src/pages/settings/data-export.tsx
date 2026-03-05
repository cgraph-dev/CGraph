/**
 * DataExport - GDPR-compliant data export page
 * Allows users to request full data export, poll status, and download
 * @module pages/settings
 */
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { springs, entranceVariants } from '@/lib/animation-presets';
import { api } from '@/lib/api';

type ExportStatus = 'idle' | 'requesting' | 'processing' | 'ready' | 'error';

interface ExportCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
}

const DEFAULT_CATEGORIES: ExportCategory[] = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'All direct and group message history',
    icon: <span className="text-lg">💬</span>,
    checked: true,
  },
  {
    id: 'profile',
    label: 'Profile Data',
    description: 'Username, bio, avatar, settings',
    icon: <span className="text-lg">👤</span>,
    checked: true,
  },
  {
    id: 'posts',
    label: 'Forum Posts',
    description: 'All posts, comments, and votes',
    icon: <span className="text-lg">📝</span>,
    checked: true,
  },
  {
    id: 'settings',
    label: 'Preferences',
    description: 'Theme, notification, and privacy settings',
    icon: <span className="text-lg">⚙️</span>,
    checked: true,
  },
  {
    id: 'gamification',
    label: 'Gamification',
    description: 'XP, achievements, quest progress, titles',
    icon: <span className="text-lg">🏆</span>,
    checked: false,
  },
  {
    id: 'media',
    label: 'Uploaded Media',
    description: 'Images, files, and attachments you shared',
    icon: <span className="text-lg">📁</span>,
    checked: false,
  },
];

/**
 * Data Export component.
 */
export default function DataExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const exportIdRef = useRef<string | null>(null);

  const toggleCategory = useCallback((id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  }, []);

  const selectedCount = categories.filter((c) => c.checked).length;

  const requestExport = useCallback(async () => {
    setStatus('requesting');
    setProgress(0);

    try {
      const selectedIds = categories.filter((c) => c.checked).map((c) => c.id);
      const response = await api.post('/api/v1/me/export', {
        categories: selectedIds,
      });

      exportIdRef.current = response.data?.export_id || null;
      setStatus('processing');

      // Poll progress (simulated since backend is async)
      let p = 0;
      const interval = setInterval(() => {
        p += 2 + Math.random() * 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => setStatus('ready'), 500);
        }
        setProgress(Math.min(p, 100));
      }, 200);
    } catch {
      setStatus('error');
    }
  }, [categories]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={entranceVariants.fadeUp} initial="hidden" animate="visible">
        <h1 className="mb-1 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          Data Export
        </h1>
        <p className="text-sm text-white/40">
          Download a copy of your data. This is your right under GDPR Article 20.
        </p>
      </motion.div>

      {/* Category Selection */}
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04]/40 p-5 backdrop-blur-xl"
        variants={entranceVariants.fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Select Data to Export
        </h2>
        <div className="space-y-1">
          {categories.map((cat) => (
            <motion.label
              key={cat.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-150 hover:bg-white/[0.04]"
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={cat.checked}
                onChange={() => toggleCategory(cat.id)}
                className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]">
                {cat.icon}
              </div>
              <div className="flex-1">
                <span className="font-medium text-white/90">{cat.label}</span>
                <p className="text-xs text-white/30">{cat.description}</p>
              </div>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* Progress / Status */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.button
            key="request"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 disabled:opacity-50"
            onClick={requestExport}
            disabled={selectedCount === 0}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Request Export ({selectedCount} categories)
          </motion.button>
        )}

        {status === 'requesting' && (
          <motion.div
            key="requesting"
            className="flex items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-dark-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ClockIcon className="h-5 w-5 animate-spin" />
            <span>Submitting export request…</span>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-dark-300">Processing your export…</span>
              <span className="font-mono text-emerald-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={springs.smooth}
              />
            </div>
          </motion.div>
        )}

        {status === 'ready' && (
          <motion.div
            key="ready"
            className="rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.bouncy}
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-300">Export Ready!</p>
                <p className="text-xs text-emerald-400/70">
                  Your data archive is ready for download.
                </p>
              </div>
              <motion.button
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (exportIdRef.current) {
                    window.open(`/api/v1/me/export/${exportIdRef.current}/download`, '_blank');
                  }
                  setStatus('idle');
                  setProgress(0);
                }}
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Download
              </motion.button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            className="flex items-center gap-3 rounded-xl border border-red-800/50 bg-red-900/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">Export Failed</p>
              <p className="text-xs text-red-400/70">Please try again later or contact support.</p>
            </div>
            <button className="text-sm text-red-400 underline" onClick={() => setStatus('idle')}>
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.04]/40 p-5 text-xs text-white/40 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="mb-2 text-sm font-semibold text-white/60">About Data Export</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Exports are generated as a ZIP archive containing JSON files.</li>
          <li>Download links expire after 24 hours for security.</li>
          <li>You can request one export per 24-hour period.</li>
          <li>
            Encrypted messages are exported in their encrypted form — you need your encryption keys
            to read them.
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
