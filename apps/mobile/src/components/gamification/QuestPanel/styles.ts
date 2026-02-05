/**
 * QuestPanel Styles
 */

import { StyleSheet, Dimensions } from 'react-native';
import { AnimationColors } from '@/lib/animations/AnimationEngine';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
  },
  headerStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: AnimationColors.primary,
  },
  headerStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  overallProgress: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  overallProgressBar: {
    height: 4,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: AnimationColors.primary,
    borderRadius: 2,
  },

  // Quest List
  questList: {
    flex: 1,
  },
  questListContent: {
    padding: 16,
    paddingTop: 0,
  },

  // Quest Section
  questSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionCount: {
    marginLeft: 8,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  sectionContent: {
    overflow: 'hidden',
    marginTop: 8,
  },

  // Quest Card
  questCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  questCardLocked: {
    opacity: 0.6,
  },
  questCardReady: {
    borderColor: AnimationColors.primary + '50',
    shadowColor: AnimationColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  questTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  questTypeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  questTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questContent: {
    padding: 12,
  },
  questHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
  textLocked: {
    color: '#6b7280',
  },

  // Quest Progress
  questProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressGradient: {
    flex: 1,
  },
  questProgressText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },

  // Rewards
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: AnimationColors.primary,
  },

  // Quest Footer
  questFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  timerTextUrgent: {
    color: '#ef4444',
    fontWeight: '600',
  },
  lockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    fontSize: 11,
    color: '#6b7280',
  },
  claimButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '600',
    color: AnimationColors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
