/**
 * UICustomizationScreen Styles
 *
 * Extracted styles for the UI customization screen.
 * Contains all style definitions for the theme customization interface.
 */

import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
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
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  previewButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  presetSection: {
    marginBottom: 20,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetScroll: {
    flexGrow: 0,
  },
  presetCard: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: '#10b981',
  },
  presetGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  presetCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sectionContent: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionRowVertical: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2.5,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sliderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorShadeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  colorShadeBox: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorShadeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  segmentedOptionSelected: {
    backgroundColor: '#10b981',
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  segmentedOptionTextSelected: {
    color: '#fff',
  },
  densityOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
    minWidth: 100,
  },
  densityOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  intensityOptionSelected: {
    backgroundColor: '#f59e0b',
  },
  densityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 8,
  },
  densityOptionTextSelected: {
    color: '#fff',
  },
  miniSegmentedOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  miniSegmentedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  glassOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassOptionSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderColor: '#a855f7',
  },
  glassOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  glassOptionTextSelected: {
    color: '#fff',
  },
  performanceOptionSelected: {
    backgroundColor: '#f59e0b',
  },
  presetButton: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  presetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  presetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});
