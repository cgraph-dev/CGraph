/**
 * Format Selector Component
 *
 * Tab selector for RSS/Atom feed formats
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import type { FormatSelectorProps, FeedFormat } from './types';
import { springs } from '@/lib/animation-presets';

const FORMATS: FeedFormat[] = ['rss', 'atom'];

export const FormatSelector = memo(function FormatSelector({
  selectedFormat,
  onFormatChange,
}: FormatSelectorProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-white/[0.04]">
      {FORMATS.map((format) => (
        <button
          key={format}
          onClick={() => onFormatChange(format)}
          className={`relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            selectedFormat === format
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {selectedFormat === format && (
            <motion.div
              layoutId="format-selector"
              className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-white/[0.06]"
              initial={false}
              transition={springs.snappy}
            />
          )}
          <span className="relative z-10">{format.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
});
