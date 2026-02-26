/**
 * QuestCard component for quest display.
 * @module screens/gamification/quests-screen/quest-card
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { type UserQuest, QUEST_TYPE_COLORS } from './types';
import { styles } from './styles';

interface QuestCardProps {
  userQuest: UserQuest;
  onAccept?: (questId: string) => void;
  onClaim?: (userQuestId: string) => void;
}

export function QuestCard({ userQuest, onAccept, onClaim }: QuestCardProps) {
  const { quest, completed, claimed, accepted } = userQuest;
  const colors = QUEST_TYPE_COLORS[quest.type] || QUEST_TYPE_COLORS.daily;

  const totalObjectives = quest.objectives.length;
  const completedObjectives = quest.objectives.filter((o) => o.completed).length;
  const progressPercent = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

  const timeRemaining = useMemo(() => {
    if (!quest.expiresAt) return null;
    const expires = new Date(quest.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  }, [quest.expiresAt]);

  const handleAction = () => {
    HapticFeedback.medium();
    if (!accepted && onAccept) {
      onAccept(quest.id);
    } else if (completed && !claimed && onClaim) {
      onClaim(userQuest.id);
    }
  };

  return (
    <View style={[styles.questCard, { borderColor: colors.primary + '40' }]}>
      <LinearGradient colors={[colors.secondary, '#1f2937']} style={styles.questGradient}>
        {/* Header */}
        <View style={styles.questHeader}>
          <View style={[styles.questTypeBadge, { backgroundColor: colors.primary + '30' }]}>
            <Text style={[styles.questTypeText, { color: colors.primary }]}>
              {quest.type.charAt(0).toUpperCase() + quest.type.slice(1)}
            </Text>
          </View>
          {timeRemaining && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.timeText}>{timeRemaining}</Text>
            </View>
          )}
        </View>

        {/* Quest Info */}
        <Text style={styles.questName}>{quest.name}</Text>
        <Text style={styles.questDescription}>{quest.description}</Text>

        {/* Objectives */}
        <View style={styles.objectivesContainer}>
          {quest.objectives.map((objective) => (
            <View key={objective.id} style={styles.objectiveRow}>
              <View
                style={[
                  styles.objectiveCheck,
                  objective.completed && styles.objectiveCheckComplete,
                ]}
              >
                {objective.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text
                style={[styles.objectiveText, objective.completed && styles.objectiveTextComplete]}
              >
                {objective.description}
              </Text>
              <Text style={styles.objectiveProgress}>
                {objective.currentValue}/{objective.targetValue}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        {accepted && !completed && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
          </View>
        )}

        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsLabel}>Rewards:</Text>
          <View style={styles.rewardsRow}>
            {quest.rewards.map((reward, index) => (
              <View key={index} style={styles.rewardBadge}>
                {reward.type === 'xp' && <Ionicons name="sparkles" size={14} color="#8b5cf6" />}
                {reward.type === 'coins' && <Text style={{ fontSize: 14 }}>🪙</Text>}
                {reward.type === 'item' && <Ionicons name="gift" size={14} color="#f59e0b" />}
                {reward.type === 'title' && <Ionicons name="ribbon" size={14} color="#ec4899" />}
                <Text style={styles.rewardText}>
                  {reward.amount} {reward.type.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        {!accepted && onAccept && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleAction}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Accept Quest</Text>
          </TouchableOpacity>
        )}
        {completed && !claimed && onClaim && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
            onPress={handleAction}
          >
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Claim Rewards</Text>
          </TouchableOpacity>
        )}
        {claimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.claimedText}>Completed & Claimed</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
