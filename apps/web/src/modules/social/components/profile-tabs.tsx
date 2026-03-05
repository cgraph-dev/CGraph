/**
 * ProfileTabs — Instagram-style animated tab bar for profile sections.
 * @module modules/social/components/profile-tabs
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  sticky?: boolean;
  className?: string;
}

/**
 * ProfileTabs — tab bar with animated underline indicator (motion layoutId).
 */
export function ProfileTabs({
  tabs,
  activeTab,
  onTabChange,
  sticky = true,
  className,
}: ProfileTabsProps) {
  return (
    <div
      className={cn(
        'border-b border-white/[0.06] bg-[rgb(18,18,24)]',
        sticky && 'sticky top-0 z-[var(--z-sticky,10)]',
        className,
      )}
    >
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'relative flex-1 px-4 py-3 text-center text-sm font-medium',
              'transition-colors',
              activeTab === tab.key ? 'text-white' : 'text-white/40 hover:text-white/60',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[11px] text-white/30">
                {tab.count}
              </span>
            )}

            {activeTab === tab.key && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProfileTabs;
