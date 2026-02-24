/**
 * PollWidget Component (React Native)
 * Interactive poll system with voting and results visualization
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Poll } from '@/types';
import { useAuthStore } from '@/stores';

interface PollWidgetProps {
  poll: Poll;
  isCreator?: boolean;
  onVote?: (optionIds: string[]) => Promise<void>;
  onClose?: () => Promise<void>;
}

export default function PollWidget({
  poll,
  isCreator = false,
  onVote,
  onClose,
}: PollWidgetProps) {
  const { user } = useAuthStore();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const isPollClosed = Boolean(poll.closed || (poll.timeout && new Date(poll.timeout) < new Date()));
  const hasVoted = useMemo(() => {
    if (!user?.id) return false;
    return poll.options.some((opt) => opt.voters?.includes(user.id));
  }, [poll.options, user?.id]);

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isPollClosed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (poll.allow_multiple) {
      setSelectedOptions((prev) => {
        const newSelection = prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];

        // Check max selections
        if (poll.max_selections && newSelection.length > poll.max_selections) {
          return prev;
        }

        return newSelection;
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || isSubmitting || !onVote) return;

    setIsSubmitting(true);

    try {
      await onVote(selectedOptions);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to vote:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePoll = () => {
    if (!isCreator || !onClose) return;

    Alert.alert(
      'Close Poll',
      'Are you sure you want to close this poll? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Poll',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClose();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to close poll');
            }
          },
        },
      ]
    );
  };

  const getPercentage = (votes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatTimeRemaining = (): string => {
    if (!poll.timeout) return '';
    const now = new Date();
    const end = new Date(poll.timeout);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };

  return (
    <View style={styles.container}>
      {/* Poll Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.question}>{poll.question}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              👥 {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </Text>
            {poll.timeout && !isPollClosed && (
              <Text style={styles.metaText}>
                ⏰ {formatTimeRemaining()}
              </Text>
            )}
            {isPollClosed && (
              <Text style={styles.closedText}>🔒 Closed</Text>
            )}
          </View>
        </View>

        {/* Close Poll Button */}
        {isCreator && !isPollClosed && (
          <TouchableOpacity
            onPress={handleClosePoll}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Poll Options */}
      <FlatList
        style={styles.options}
        showsVerticalScrollIndicator={false}
        data={poll.options}
        keyExtractor={(item) => item.id}
        extraData={{ selectedOptions, hasVoted, isPollClosed }}
        renderItem={({ item: option }) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOptions.includes(option.id);
          const showResults = hasVoted || isPollClosed;

          return (
            <View style={styles.optionWrapper}>
              {showResults ? (
                // Results View
                <View style={styles.resultOption}>
                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[styles.progressBar, { width: `${percentage}%` }]}
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.resultContent}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    <View style={styles.resultStats}>
                      <Text style={styles.votesText}>{option.votes} votes</Text>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Voting View
                <TouchableOpacity
                  onPress={() => handleOptionToggle(option.id)}
                  disabled={isPollClosed}
                  style={[
                    styles.voteOption,
                    isSelected && styles.voteOptionSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionSelector}>
                    {poll.allow_multiple ? (
                      // Checkbox
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    ) : (
                      // Radio
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    )}
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Vote Button */}
      {!hasVoted && !isPollClosed && (
        <TouchableOpacity
          onPress={handleSubmitVote}
          disabled={selectedOptions.length === 0 || isSubmitting}
          style={[
            styles.submitButton,
            (selectedOptions.length === 0 || isSubmitting) && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Poll Info */}
      <View style={styles.info}>
        {poll.allow_multiple && !hasVoted && !isPollClosed && (
          <Text style={styles.infoText}>
            Multiple choice poll
            {poll.max_selections && ` (max ${poll.max_selections} selections)`}
          </Text>
        )}
        <Text style={styles.infoText}>
          {poll.public ? '👁️ Public poll - voters are visible' : '🔒 Anonymous poll'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1f2937', // dark-800
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151', // dark-700
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af', // gray-400
  },
  closedText: {
    fontSize: 12,
    color: '#ef4444', // red-500
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7f1d1d', // red-900
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444', // red-500
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fca5a5', // red-300
  },
  options: {
    gap: 12,
    maxHeight: 300,
  },
  optionWrapper: {
    marginBottom: 12,
  },
  voteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151', // dark-700
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4b5563', // dark-600
    gap: 12,
  },
  voteOptionSelected: {
    borderColor: '#10b981', // primary-500
    backgroundColor: '#064e3b', // dark-green
  },
  optionSelector: {
    width: 20,
    height: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280', // gray-500
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#10b981', // primary-500
    backgroundColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6b7280', // gray-500
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#10b981', // primary-500
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981', // primary-500
  },
  resultOption: {
    position: 'relative',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563', // dark-600
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#065f46', // dark-green
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 1,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  votesText: {
    fontSize: 12,
    color: '#9ca3af', // gray-400
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981', // primary-400
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  submitButton: {
    padding: 14,
    backgroundColor: '#10b981', // primary-500
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#374151', // dark-700
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  info: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151', // dark-700
  },
  infoText: {
    fontSize: 11,
    color: '#6b7280', // gray-500
  },
});
