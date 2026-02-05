/**
 * StickerPicker Styles
 */

import { StyleSheet, Dimensions } from 'react-native';
import { AnimationColors } from '@/lib/animations/AnimationEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: '75%',
    width: '100%',
  },
  content: {
    flex: 1,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AnimationColors.dark600,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AnimationColors.white,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AnimationColors.dark700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '700',
    color: AnimationColors.amber,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AnimationColors.dark700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: AnimationColors.gray400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AnimationColors.dark700,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AnimationColors.white,
  },
  packTabs: {
    marginTop: 16,
    maxHeight: 100,
  },
  packTabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  packTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AnimationColors.dark700,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packTabActive: {
    backgroundColor: AnimationColors.dark600,
    borderColor: AnimationColors.primary,
  },
  packIcon: {
    fontSize: 20,
  },
  packName: {
    fontSize: 14,
    fontWeight: '600',
    color: AnimationColors.gray400,
  },
  packNameActive: {
    color: AnimationColors.white,
  },
  limitedBadge: {
    marginLeft: 4,
  },
  limitedText: {
    fontSize: 14,
  },
  premiumBadge: {
    marginLeft: 4,
  },
  premiumText: {
    fontSize: 14,
  },
  stickersScroll: {
    flex: 1,
    marginTop: 16,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  stickerItem: {
    width: (SCREEN_WIDTH - 64) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stickerEmoji: {
    fontSize: 36,
  },
  stickerLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 20,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AnimationColors.dark800,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  priceCoin: {
    fontSize: 12,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: AnimationColors.gray500,
  },
});
