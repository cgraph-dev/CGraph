/**
 * Export/Import Modal Component
 * @module modules/settings/components/ui-customization
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface ExportImportModalProps {
  exportData: string;
  onImport: (data: string) => void;
  onClose: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Export Import Modal dialog component.
 */
export function ExportImportModal({ exportData, onImport, onClose }: ExportImportModalProps) {
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="holographic" glow className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Export / Import Settings</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Export (Copy to share)
              </label>
              <div className="relative">
                <textarea
                  value={exportData}
                  readOnly
                  className="h-40 w-full resize-none rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 font-mono text-xs text-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportData);
                    setCopied(true);
                    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
                    HapticFeedback.success();
                  }}
                  className="absolute right-2 top-2 rounded-lg bg-primary-600 px-3 py-1 text-sm text-white transition-colors hover:bg-primary-500"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Import (Paste settings)
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste settings JSON here..."
                className="h-40 w-full resize-none rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 font-mono text-xs text-white focus:border-primary-500 focus:outline-none"
              />
              <button
                onClick={() => onImport(importText)}
                disabled={!importText.trim()}
                className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-500 disabled:bg-dark-700 disabled:text-gray-500"
              >
                Import Settings
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
