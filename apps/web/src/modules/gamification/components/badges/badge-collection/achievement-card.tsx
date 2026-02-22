/**
 * AchievementCard - grid and list item display for achievements
 */

import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip, RARITY_COLORS } from '../animated-badge';
import type { Achievement } from './types';

interface AchievementCardProps {
  achievement: Achievement;
  layout: 'grid' | 'list';
  index: number;
  isEquipped: boolean;
  onClick?: () => void;
  onEquip?: () => void;
}

export function AchievementCard({
  achievement,
  layout,
  index,
  isEquipped,
  onClick,
  onEquip,
}: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity];
  const progress =
    achievement.maxProgress > 0 ? (achievement.progress / achievement.maxProgress) * 100 : 0;

  if (layout === 'list') {
    return (
      <ListItem
        achievement={achievement}
        index={index}
        isEquipped={isEquipped}
        colors={colors}
        progress={progress}
        onClick={onClick}
        onEquip={onEquip}
      />
    );
  }

  return (
    <GridItem
      achievement={achievement}
      index={index}
      isEquipped={isEquipped}
      colors={colors}
      progress={progress}
      onClick={onClick}
    />
  );
}

interface ItemProps {
  achievement: Achievement;
  index: number;
  isEquipped: boolean;
  colors: { primary: string; secondary: string };
  progress: number;
  onClick?: () => void;
  onEquip?: () => void;
}

function ListItem({
  achievement,
  index,
  isEquipped,
  colors,
  progress,
  onClick,
  onEquip,
}: ItemProps) {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-4 rounded-xl p-4',
        'border border-white/5 bg-dark-800/50',
        'hover:border-white/10 hover:bg-dark-700/50',
        'cursor-pointer transition-all'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
    >
      <AnimatedBadgeWithTooltip
        achievement={achievement}
        size="md"
        animated={achievement.unlocked}
        showProgress
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'truncate font-semibold',
              achievement.unlocked ? 'text-white' : 'text-gray-400'
            )}
          >
            {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
          </h3>
          {isEquipped && (
            <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-xs text-primary-400">
              Equipped
            </span>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">
          {achievement.unlocked || !achievement.isHidden
            ? achievement.description
            : 'Hidden achievement'}
        </p>
        {!achievement.unlocked && achievement.maxProgress > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-600">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {achievement.progress}/{achievement.maxProgress}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span
          className="rounded-lg px-2 py-1 text-xs font-medium uppercase"
          style={{
            backgroundColor: `${colors.primary}20`,
            color: colors.primary,
          }}
        >
          {achievement.rarity}
        </span>
        <span className="text-sm text-gray-400">+{achievement.xpReward} XP</span>
        {achievement.unlocked && onEquip && !isEquipped && (
          <motion.button
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              'bg-primary-500/20 text-primary-400',
              'transition-colors hover:bg-primary-500/30'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onEquip();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Equip
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function GridItem({
  achievement,
  index,
  isEquipped,
  colors,
  progress,
  onClick,
}: Omit<ItemProps, 'onEquip'>) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl p-4',
        'border border-white/5 bg-dark-800/50',
        'hover:border-white/10 hover:bg-dark-700/50',
        'cursor-pointer transition-all',
        'flex flex-col items-center text-center'
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute right-2 top-2">
          <CheckCircleIcon className="h-4 w-4 text-primary-400" />
        </div>
      )}

      {/* Badge */}
      <AnimatedBadgeWithTooltip
        achievement={achievement}
        size="lg"
        animated={achievement.unlocked}
        showProgress
      />

      {/* Title */}
      <h3
        className={cn(
          'mt-3 w-full truncate text-sm font-semibold',
          achievement.unlocked ? 'text-white' : 'text-gray-400'
        )}
      >
        {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
      </h3>

      {/* Rarity */}
      <span
        className="mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
        style={{
          backgroundColor: `${colors.primary}20`,
          color: colors.primary,
        }}
      >
        {achievement.rarity}
      </span>

      {/* Progress bar (if in progress) */}
      {!achievement.unlocked && achievement.maxProgress > 1 && progress > 0 && (
        <div className="mt-2 w-full">
          <div className="h-1 overflow-hidden rounded-full bg-dark-600">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />
          </div>
          <span className="mt-0.5 text-[10px] text-gray-500">
            {achievement.progress}/{achievement.maxProgress}
          </span>
        </div>
      )}

      {/* XP reward */}
      <span className="mt-1 text-xs text-gray-500">+{achievement.xpReward} XP</span>
    </motion.div>
  );
}
