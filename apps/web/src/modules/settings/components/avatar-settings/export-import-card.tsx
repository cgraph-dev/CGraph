/**
 * ExportImportCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'framer-motion';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { GlassCard, useAvatarStyle } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface ExportImportCardProps {
  importText: string;
  onImportTextChange: (text: string) => void;
  onExport: () => void;
  onImport: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Export Import Card display component.
 */
export function ExportImportCard({
  importText,
  onImportTextChange,
  onExport,
  onImport,
}: ExportImportCardProps) {
  const { resetStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <h3 className="mb-4 text-lg font-semibold text-white">Share Your Style</h3>
      <div className="space-y-4">
        <motion.button
          onClick={onExport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-3 text-white transition-colors hover:bg-primary-500/30"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export Avatar Style
        </motion.button>

        <div>
          <label className="mb-2 block text-sm text-gray-400">Import Style (Paste JSON)</label>
          <textarea
            value={importText}
            onChange={(e) => onImportTextChange(e.target.value)}
            placeholder='{"borderStyle":"rainbow","borderWidth":3,...}'
            className="w-full rounded-lg border border-dark-600 bg-dark-700/50 px-4 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            rows={4}
          />
          <motion.button
            onClick={onImport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!importText.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500 bg-purple-500/20 px-4 py-3 text-white transition-colors hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            Import Avatar Style
          </motion.button>
        </div>

        <motion.button
          onClick={() => {
            resetStyle();
            HapticFeedback.medium();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-lg border border-dark-600 bg-dark-700/50 px-4 py-3 text-gray-400 transition-colors hover:border-red-500 hover:text-red-400"
        >
          Reset to Defaults
        </motion.button>
      </div>
    </GlassCard>
  );
}
