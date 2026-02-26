import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing[20],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  newPostButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  composerContainer: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  composerCard: {
    padding: Spacing[4],
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  composerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  composerInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[3],
  },
  composerMedia: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  mediaButton: {
    padding: Spacing[2],
  },
  postButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonGradient: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2],
  },
  postButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  postContainer: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  postCard: {
    padding: Spacing[4],
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postUserInfo: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  postUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  postUserName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  postTime: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing[2],
  },
  postContent: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[3],
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark[700],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: Typography.fontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  statText: {
    fontSize: Typography.fontSize.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
