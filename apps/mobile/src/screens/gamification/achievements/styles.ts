/**
 * Styles for the Achievements screen and its components.
 *
 * @module screens/gamification/achievements/styles
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerStats: {
    alignItems: 'center',
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  categoryTabs: {
    height: 44,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#8b5cf6',
  },
  categoryTabText: {
    color: '#6b7280',
    fontSize: 14,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  rarityFilter: {
    height: 40,
    marginTop: 8,
  },
  rarityFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  rarityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  rarityChipText: {
    color: '#6b7280',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 28,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
    marginLeft: 12,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  coinEmoji: {
    fontSize: 12,
  },
  rewardText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  largeIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeIconEmoji: {
    fontSize: 40,
  },
  largeUnlockedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  modalProgressSection: {
    width: '100%',
    marginTop: 20,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  unlockedDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalRewards: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  modalRewardsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  modalRewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modalRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  modalRewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
