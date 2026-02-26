/**
 * Styles for the forum reorder screen and its sub-components.
 * @module screens/admin/forum-reorder-screen/styles
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  categoryHeaderDragging: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  forumsContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  forumRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forumItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  forumItemDragging: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  forumItemActive: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dragHandle: {
    padding: 4,
  },
  forumIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  forumMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moveButtons: {
    flexDirection: 'column',
    marginLeft: 8,
    gap: 2,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
});
