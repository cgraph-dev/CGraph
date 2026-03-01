/**
 * EmptyGroupState Component
 *
 * Displayed when no groups are available.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import type { ThemeColors } from '@/stores';

interface EmptyGroupStateProps {
  colors: ThemeColors;
  onCreatePress?: () => void;
  onExplorePress?: () => void;
}

/**
 *
 */
export function EmptyGroupState({ colors, onCreatePress, onExplorePress }: EmptyGroupStateProps) {
  return (
    <View style={styles.emptyState}>
      <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.emptyIconContainer}>
          <Ionicons name="people" size={48} color="#fff" />
        </LinearGradient>

        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Groups Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Join a community or create{'\n'}your own group
        </Text>

        <View style={styles.emptyButtons}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCreatePress?.();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.emptyButton}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Group</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onExplorePress?.();
            }}
            activeOpacity={0.8}
          >
            <GlassCard variant="frosted" intensity="subtle" style={styles.emptyButtonOutline}>
              <View style={styles.emptyButtonOutlineInner}>
                <Ionicons name="compass" size={18} color={colors.primary} />
                <Text style={[styles.emptyButtonOutlineText, { color: colors.text }]}>
                  Browse Groups
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButtons: {
    gap: 12,
    width: '100%',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyButtonOutline: {
    borderRadius: 20,
    padding: 0,
  },
  emptyButtonOutlineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
