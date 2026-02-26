/**
 * Styles for the FilterModal component.
 *
 * @module screens/search/SearchScreen/components/filter-modal.styles
 */

import { StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const filterStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
