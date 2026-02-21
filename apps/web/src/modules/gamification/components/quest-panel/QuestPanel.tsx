/**
 * QuestPanel Component - Main quest tracking panel with variant support
 * @module modules/gamification/components/quest-panel
 */
import { useState, useEffect, useCallback } from 'react';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore, Quest } from '@/modules/gamification/store';
import confetti from 'canvas-confetti';
import type { QuestPanelProps } from './types';
import { formatTimeRemaining } from './utils';
import { CompactQuestPanel } from './CompactQuestPanel';
import { FullQuestPanel } from './FullQuestPanel';

export default function QuestPanel({
  variant = 'full',
  maxQuests = 5,
  className = '',
  onQuestComplete,
}: QuestPanelProps) {
  const { activeQuests, completedQuests, completeQuest, fetchQuests, isLoading } =
    useGamificationStore();
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Fetch quests on mount
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Update time remaining every minute (pauses when tab is hidden)
  const updateTimes = useCallback(() => {
    const times: Record<string, string> = {};
    activeQuests.forEach((quest) => {
      if (quest.expiresAt) {
        times[quest.id] = formatTimeRemaining(quest.expiresAt);
      }
    });
    setTimeRemaining(times);
  }, [activeQuests]);

  useAdaptiveInterval(updateTimes, 60_000, { immediate: true });

  // Handle claiming quest rewards
  const handleClaimReward = useCallback(
    async (quest: Quest) => {
      if (claimingQuestId) return;

      setClaimingQuestId(quest.id);
      HapticFeedback.success();

      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#f59e0b'],
      });

      try {
        await completeQuest(quest.id);
        onQuestComplete?.(quest);
      } finally {
        setClaimingQuestId(null);
      }
    },
    [claimingQuestId, completeQuest, onQuestComplete]
  );

  const displayedQuests = activeQuests.slice(0, maxQuests);
  const completedToday = completedQuests.filter((q) => {
    if (!q.completedAt) return false;
    const today = new Date().toDateString();
    return new Date(q.completedAt).toDateString() === today;
  }).length;

  if (variant === 'compact') {
    return (
      <CompactQuestPanel
        className={className}
        displayedQuests={displayedQuests}
        completedToday={completedToday}
        totalQuests={activeQuests.length + completedToday}
      />
    );
  }

  return (
    <FullQuestPanel
      className={className}
      displayedQuests={displayedQuests}
      activeQuests={activeQuests}
      completedToday={completedToday}
      maxQuests={maxQuests}
      isLoading={isLoading}
      claimingQuestId={claimingQuestId}
      expandedQuest={expandedQuest}
      timeRemaining={timeRemaining}
      onExpandQuest={setExpandedQuest}
      onClaimReward={handleClaimReward}
      onRefresh={fetchQuests}
    />
  );
}
