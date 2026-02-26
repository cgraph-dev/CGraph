/**
 * GlassCard V2 - Styles
 *
 * StyleSheet definitions for the glassmorphism card layers.
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 10,
  },
  borderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  borderGradient: {
    flex: 1,
  },
  borderInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
    zIndex: 3,
  },
  scanlinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  pressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});
