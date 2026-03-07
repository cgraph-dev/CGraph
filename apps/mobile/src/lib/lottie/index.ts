/**
 * Mobile Lottie Library
 *
 * Native Lottie animation support for React Native using lottie-react-native.
 * Provides renderer, filesystem cache, React hook, and shared types.
 *
 * @module lib/lottie
 */

export { LottieRenderer } from './lottie-renderer';
export type { LottieRendererProps } from './lottie-types';
export { useLottie } from './use-lottie';
export { lottieCache, preloadAnimations, getCachedPath } from './lottie-cache';
export {
  emojiToCodepoint,
  getLottieCdnUrl,
  getWebPFallbackUrl,
  LOTTIE_CDN_BASE,
} from './lottie-types';
export type { AnimationFormat, LottieSource, LottieCacheEntry } from './lottie-types';
