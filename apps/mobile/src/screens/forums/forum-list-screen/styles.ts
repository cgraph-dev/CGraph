import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchCard: {
    borderRadius: 14,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  forumWrapper: {
    marginBottom: 12,
  },
  forumCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  forumInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  forumIconWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  forumIconImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  forumIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forumIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  forumInfo: {
    flex: 1,
  },
  forumNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  forumName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  hotBadge: {
    marginLeft: 6,
  },
  hotBadgeText: {
    fontSize: 12,
  },
  forumDescription: {
    fontSize: 13,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6b7280',
    marginHorizontal: 8,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButtons: {
    gap: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
