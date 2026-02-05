/**
 * CreatePostScreen styles
 */

import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // Section label
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  // Post type selector
  postTypeContainer: {
    marginBottom: 24,
  },
  postTypeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  postTypeRow: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  postTypeIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  postTypeIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },
  postTypeOption: {
    flex: 1,
    zIndex: 1,
  },
  postTypeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  postTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  postTypeLabelActive: {
    color: '#FFF',
  },
  // Input field
  inputContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputBorder: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    minHeight: 56,
  },
  // Character count
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  charProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  charProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  charCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Preview
  previewHint: {
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'capitalize',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerContent: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  // Cancel button
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Submit button
  submitButtonWrapper: {
    position: 'relative',
  },
  submitButtonGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
});
