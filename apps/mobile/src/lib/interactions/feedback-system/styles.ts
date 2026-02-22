/**
 * FeedbackSystem Styles
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
  },
  shimmer: {
    height: '100%',
  },
  skeletonCard: {
    marginBottom: 16,
  },
  skeletonCardContent: {
    marginTop: 12,
    gap: 8,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonListItemContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  feedbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {},
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateAction: {
    marginTop: 24,
  },
  rippleContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  rippleCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
