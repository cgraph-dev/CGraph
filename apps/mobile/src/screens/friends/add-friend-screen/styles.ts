/**
 * Styles for the add friend screen and its sub-components.
 * @module screens/friends/add-friend-screen/styles
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#8B5CF6',
    borderRadius: 100,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    padding: 24,
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputWrapper: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F3F4F6',
    height: 56,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  successGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  successText: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
  },
  dot1: { opacity: 0.3 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 1 },
  infoCard: {
    padding: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F3F4F6',
    marginLeft: 10,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  tipsCard: {
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 12,
    lineHeight: 20,
  },
});
