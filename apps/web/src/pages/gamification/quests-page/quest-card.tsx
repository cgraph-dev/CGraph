/**
 * QuestCard component
 * Displays a single quest with type badge, timer, objectives, and action buttons.
 * @module quests-page/QuestCard
 */

import { motion } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  SparklesIcon,
  ClockIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { QuestCardProps } from './types';
import { getTimeLeft } from './utils';
import ObjectiveItem from './objective-item';

export default function QuestCard({
  quest,
  onAccept,
  onClaim,
  isAccepting,
  isClaiming,
}: QuestCardProps) {
  const allObjectivesComplete = quest.objectives.every((obj) => obj.completed);
  const canClaim = allObjectivesComplete && quest.completed;
  const timeLeft = quest.expiresAt ? getTimeLeft(quest.expiresAt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <GlassCard
        variant={canClaim ? 'holographic' : 'default'}
        glow={canClaim}
        className={`p-5 ${canClaim ? 'ring-2 ring-green-500/50' : ''}`}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  quest.type === 'daily'
                    ? 'bg-orange-500/20 text-orange-400'
                    : quest.type === 'weekly'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {quest.type}
              </span>
              {timeLeft && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  {timeLeft}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">{quest.title}</h3>
            <p className="mt-1 text-sm text-gray-400">{quest.description}</p>
          </div>

          {/* Rewards Preview */}
          <div className="flex items-center gap-2">
            {quest.xpReward > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-purple-500/20 px-2 py-1">
                <SparklesIcon className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400">+{quest.xpReward}</span>
              </div>
            )}
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-4 space-y-3">
          {quest.objectives.map((objective, index) => (
            <ObjectiveItem key={objective.id || index} objective={objective} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onAccept && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onAccept();
                HapticFeedback.medium();
              }}
              disabled={isAccepting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isAccepting ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <ClipboardDocumentListIcon className="h-4 w-4" />
              )}
              Accept Quest
            </motion.button>
          )}

          {canClaim && onClaim && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClaim();
                HapticFeedback.success();
              }}
              disabled={isClaiming}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isClaiming ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <GiftIcon className="h-4 w-4" />
              )}
              Claim Rewards
            </motion.button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
