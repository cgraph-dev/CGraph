/** RewardCard — displays a gamification event reward with type-specific icons. */
import { motion } from 'motion/react';
import {
  TrophyIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  BoltIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import type { EventReward } from '@/modules/gamification/store';
import {
  REWARD_CARD_SIZE_CLASSES,
  REWARD_CARD_ICON_SIZES,
  RARITY_COLORS,
  RARITY_FALLBACK,
} from '@/modules/gamification/components/events/event-rewards-display.constants';
import type { RewardCardSize } from '@/modules/gamification/components/events/event-rewards-display.constants';

// ==================== REWARD ICON ====================

/**
 * unknown for the gamification module.
 */
/**
 * Reward Icon component.
 */
export function RewardIcon({ reward }: { reward: EventReward }) {
  const iconClass = 'h-5 w-5';

  switch (reward.type) {
    case 'coins':
      return <CurrencyDollarIcon className={`${iconClass} text-yellow-400`} />;
    case 'gems':
      return <SparklesIcon className={`${iconClass} text-blue-400`} />;
    case 'xp':
      return <BoltIcon className={`${iconClass} text-purple-400`} />;
    case 'title':
      return <StarIcon className={`${iconClass} text-pink-400`} />;
    case 'border':
      return <TrophyIcon className={`${iconClass} text-orange-400`} />;
    case 'effect':
      return <SparklesIcon className={`${iconClass} text-cyan-400`} />;
    case 'badge':
      return <StarIcon className={`${iconClass} text-green-400`} />;
    default:
      return <TrophyIcon className={iconClass} />;
  }
}

// ==================== REWARD CARD ====================

export interface RewardCardProps {
  reward: EventReward;
  size?: RewardCardSize;
  showLabel?: boolean;
}

/**
 * unknown for the gamification module.
 */
/**
 * Reward Card display component.
 */
export function RewardCard({ reward, size = 'md', showLabel = true }: RewardCardProps) {
  const rarityColor = reward.rarity
     
    ? RARITY_COLORS[reward.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common
    : RARITY_FALLBACK;

  return (
    <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
      <div
        className={`${REWARD_CARD_SIZE_CLASSES[size]} rounded-xl bg-gradient-to-br ${rarityColor} relative flex items-center justify-center overflow-hidden border`}
      >
        {reward.previewUrl ? (
          <img src={reward.previewUrl} alt={reward.name} className="h-full w-full object-cover" />
        ) : (
          <div className={REWARD_CARD_ICON_SIZES[size]}>
            <RewardIcon reward={reward} />
          </div>
        )}
        {reward.amount && (
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">
            {reward.amount}
          </div>
        )}
      </div>
      {showLabel && (
        <span className="max-w-[80px] truncate text-center text-xs text-white/70">
          {reward.name}
        </span>
      )}
    </motion.div>
  );
}
