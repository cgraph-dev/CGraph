/**
 * Feed Mode Tabs — Tab bar for switching between 5 discovery feed modes
 *
 * @module modules/discovery/components/feed-mode-tabs
 */

import { cn } from '@/lib/utils';
import type { FeedMode } from '../store/discoveryStore';

const MODES: Array<{ key: FeedMode; label: string; icon: string }> = [
  { key: 'pulse', label: 'Pulse', icon: '💓' },
  { key: 'fresh', label: 'Fresh', icon: '🆕' },
  { key: 'rising', label: 'Rising', icon: '🚀' },
  { key: 'deep_cut', label: 'Deep Cut', icon: '💎' },
  { key: 'frequency_surf', label: 'Frequency Surf', icon: '🏄' },
];

interface FeedModeTabsProps {
  activeMode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
  className?: string;
}

export function FeedModeTabs({ activeMode, onModeChange, className }: FeedModeTabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1', className)}>
      {MODES.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all',
            activeMode === key
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/50 hover:bg-white/5 hover:text-white/80'
          )}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default FeedModeTabs;
