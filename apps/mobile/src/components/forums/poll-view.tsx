/**
 * PollView — enhanced poll results component with animated bars.
 *
 * Composes with PollWidget for voting; this component focuses on
 * animated result visualization using Reanimated v4 SharedValue + withSpring.
 *
 * @module components/forums/poll-view
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Poll } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PollViewProps {
  poll: Poll;
  /** Called when user votes */
  onVote?: (optionIds: string[]) => Promise<void>;
  /** Called to close the poll */
  onClose?: () => Promise<void>;
  isCreator?: boolean;
  currentUserId?: string;
}

// ---------------------------------------------------------------------------
// Animated bar sub-component
// ---------------------------------------------------------------------------

function AnimatedBar({
  percentage,
  index,
  isLeading,
}: {
  percentage: number;
  index: number;
  isLeading: boolean;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    // Stagger animation by index
    width.value = withDelay(
      index * 80,
      withSpring(percentage, {
        damping: 18,
        stiffness: 90,
        mass: 0.8,
      })
    );
  }, [percentage, index, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={barStyles.track}>
      <Animated.View
        style={[
          barStyles.fill,
          animatedStyle,
          { backgroundColor: isLeading ? '#10B981' : '#374151' },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------

function useCountdown(timeout?: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!timeout) return;

    const tick = () => {
      const now = Date.now();
      const end = new Date(timeout).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timeout]);

  return timeLeft;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Poll View component. */
export default function PollView({
  poll,
  onVote,
  onClose,
  isCreator = false,
  currentUserId,
}: PollViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVotes = useMemo(
    () => poll.options.reduce((sum, opt) => sum + opt.votes, 0),
    [poll.options]
  );

  const isPollClosed = Boolean(
    poll.closed || (poll.timeout && new Date(poll.timeout) < new Date())
  );

  const hasVoted = useMemo(() => {
    if (!currentUserId) return false;
    return poll.options.some((opt) => opt.voters?.includes(currentUserId));
  }, [poll.options, currentUserId]);

  const showResults = hasVoted || isPollClosed;
  const timeLeft = useCountdown(poll.timeout || undefined);

  const maxVotes = useMemo(() => Math.max(...poll.options.map((o) => o.votes), 1), [poll.options]);

  const getPercentage = (votes: number) =>
    totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

  const handleToggle = (optionId: string) => {
    if (hasVoted || isPollClosed) return;

    if (poll.allow_multiple) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
        if (poll.max_selections && prev.length >= poll.max_selections) return prev;
        return [...prev, optionId];
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (!onVote || selectedOptions.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onVote(selectedOptions);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.question}>{poll.question}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </Text>
          {timeLeft && !isPollClosed && (
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={12} color="#F59E0B" />
              <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
          )}
          {isPollClosed && (
            <View style={styles.closedPill}>
              <Ionicons name="lock-closed" size={12} color="#EF4444" />
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option, index) => {
          const pct = getPercentage(option.votes);
          const isLeading = option.votes === maxVotes && totalVotes > 0;
          const isSelected = selectedOptions.includes(option.id);

          return (
            <View key={option.id}>
              {showResults ? (
                /* Results mode — animated bars */
                <View style={styles.resultRow}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    <Text style={[styles.pctText, isLeading && styles.pctLeading]}>{pct}%</Text>
                  </View>
                  <AnimatedBar percentage={pct} index={index} isLeading={isLeading} />
                  <Text style={styles.votesCount}>
                    {option.votes} vote{option.votes !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                /* Voting mode */
                <TouchableOpacity
                  style={[styles.voteOption, isSelected && styles.voteOptionSelected]}
                  onPress={() => handleToggle(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selector}>
                    {poll.allow_multiple ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    ) : (
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    )}
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Vote button */}
      {!hasVoted && !isPollClosed && (
        <TouchableOpacity
          style={[
            styles.voteButton,
            (selectedOptions.length === 0 || isSubmitting) && styles.voteButtonDisabled,
          ]}
          onPress={handleVote}
          disabled={selectedOptions.length === 0 || isSubmitting}
        >
          <Text style={styles.voteButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Close button */}
      {isCreator && !isPollClosed && onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close Poll</Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          {poll.public ? '👁️ Public poll' : '🔒 Anonymous poll'}
          {poll.allow_multiple ? ' • Multiple choice' : ''}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    gap: 14,
  },
  header: {
    gap: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  closedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF444420',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  closedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  options: {
    gap: 10,
  },
  // -- Results mode
  resultRow: {
    gap: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  pctLeading: {
    color: '#10B981',
  },
  votesCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  // -- Vote mode
  voteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4B5563',
    gap: 12,
  },
  voteOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  selector: {
    width: 20,
    height: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#10B981',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  voteButton: {
    padding: 14,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    backgroundColor: '#374151',
  },
  voteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
