import { StyleSheet } from 'react-native';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark[950],
  },
  safeArea: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
    marginTop: Spacing[4],
  },
  noVideoSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark[400],
    marginTop: Spacing[1],
  },
  pip: {
    position: 'absolute',
    width: 120,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  pipContent: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipVideoOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark[800],
  },
  pipBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    left: Spacing[2],
    backgroundColor: Colors.dark[900] + 'CC',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  pipBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[50],
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark[800] + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    alignItems: 'center',
  },
  callDuration: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[50],
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[1],
  },
  encryptedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[400],
  },
  bottomControls: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    paddingVertical: Spacing[4],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  controlButtonActive: {},
  controlIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.dark[300],
  },
  endCallButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  connectingName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark[50],
    marginTop: Spacing[6],
  },
  connectingStatus: {
    fontSize: Typography.fontSize.lg,
    color: Colors.dark[400],
  },
  incomingControls: {
    flexDirection: 'row',
    gap: Spacing[16],
    marginTop: Spacing[12],
  },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  callButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    shadowColor: Colors.red[500],
  },
  answerButton: {
    shadowColor: Colors.primary[500],
  },
});
