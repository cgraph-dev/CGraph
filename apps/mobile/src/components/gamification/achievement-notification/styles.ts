import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const NOTIFICATION_WIDTH = SCREEN_WIDTH - 32;
export const AUTO_DISMISS_DURATION = 5000;

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    zIndex: 9999,
  },
  toastContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    transform: [{ scale: 1.1 }],
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: 16,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 14,
    padding: 12,
  },
  iconSection: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'right',
  },
  actionSection: {
    marginLeft: 8,
  },
  viewButton: {
    padding: 4,
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  dismissProgressBar: {
    height: 2,
    backgroundColor: '#10b981',
  },
});
